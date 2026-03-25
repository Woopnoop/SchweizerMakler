/**
 * Content Script für kleinanzeigen.de
 *
 * Liest Anzeigendaten von Detailseiten.
 * KEIN DOM wird verändert. Nur querySelector zum Lesen.
 *
 * Risikobewertung: GERING — AGB verbieten nur Bots/Crawler, kein Plugin-Verbot.
 */

import {
  waitForIdle, safeQuery, safeQueryFirst, safeQueryAll,
  sendToBackground, extractIdFromUrl, findTextByPattern, debugLog,
} from "./base-parser";
import { parseGermanPrice, parseArea, parseRooms, detectListingType } from "../utils/price-parser";

waitForIdle(() => {
  debugLog("Kleinanzeigen Content Script aktiv auf:", window.location.href);

  // Auf Detailseiten aktiv — verschiedene URL-Muster
  const path = window.location.pathname;
  const isDetailPage =
    path.includes("/s-anzeige/") ||
    path.includes("/anzeige/") ||
    /\/\d{5,}/.test(path); // Numerische ID in URL

  if (!isDetailPage) {
    debugLog("Keine Detailseite erkannt, überspringe.");
    return;
  }

  // Preis — viele Fallback-Selektoren für verschiedene Layouts
  const priceText = safeQueryFirst(
    "#viewad-price",
    "[itemprop='price']",
    "[data-testid='price']",
    "[class*='price'] h2",
    "[class*='Price']",
    "[class*='adPrice']",
    "h2[class*='Price']",
    ".boxedarticle--price",
  );

  // Letzter Fallback: Preis per Regex im Body suchen
  const priceSource = priceText ?? findTextByPattern(/\d{1,3}(?:\.\d{3})*(?:,\d{2})?\s*€/);
  const price = parseGermanPrice(priceSource ?? "");
  debugLog("Preis gefunden:", priceSource, "→", price);

  if (!price) {
    debugLog("KEIN PREIS gefunden — überspringe diese Seite.");
    return;
  }

  // Titel — spezifischen Selektor bevorzugen, h1 kann Badge-Texte enthalten
  let title = safeQueryFirst(
    "#viewad-title",
    "[itemprop='name']",
    "[data-testid='title']",
    "h1[class*='title']",
    "h1[class*='Title']",
    "h1",
  ) ?? "";

  // Status-Prefixe entfernen die Kleinanzeigen in den Titel rendert
  title = title
    .replace(/^(?:Reserviert|Gelöscht|Deaktiviert|Pausiert)\s*•?\s*/gi, "")
    .replace(/^(?:Reserviert|Gelöscht|Deaktiviert|Pausiert)\s*•?\s*/gi, "") // Doppelt für mehrere Prefixe
    .replace(/^(?:Reserviert|Gelöscht|Deaktiviert|Pausiert)\s*•?\s*/gi, "")
    .replace(/^•\s*/, "")
    .trim();

  debugLog("Titel:", title);
  if (!title) {
    debugLog("KEIN TITEL gefunden — überspringe.");
    return;
  }

  // Ort
  const location = safeQueryFirst(
    "#viewad-locality",
    "[itemprop='locality']",
    "[data-testid='locality']",
    "[class*='locality']",
    "[class*='Location']",
    "[class*='address']",
    "[id*='location']",
  ) ?? "";
  debugLog("Ort:", location);

  // External ID aus URL
  const externalId = extractIdFromUrl(path);
  if (!externalId) {
    debugLog("KEINE ID in URL gefunden.");
    return;
  }
  debugLog("External ID:", externalId);

  // Fläche und Zimmer — aus allen sichtbaren Textblöcken suchen
  let areaSqm: number | undefined;
  let rooms: number | undefined;

  // Spezifische Selektoren versuchen
  const detailItems = [
    ...safeQueryAll("#viewad-details .addetailslist--detail"),
    ...safeQueryAll("[class*='attribute'] li"),
    ...safeQueryAll("[class*='Attribute'] li"),
    ...safeQueryAll("[data-testid*='attribute']"),
    ...safeQueryAll("[class*='detail'] span"),
    ...safeQueryAll("[class*='keyValue']"),
  ];

  for (const item of detailItems) {
    const text = item.textContent ?? "";
    if (!areaSqm && (text.includes("m²") || text.includes("qm") || text.includes("Fläche"))) {
      areaSqm = parseArea(text) ?? undefined;
    }
    if (!rooms && (text.includes("Zimmer") || text.includes("Zi"))) {
      rooms = parseRooms(text) ?? undefined;
    }
  }

  // Fallback: Fläche und Zimmer aus dem gesamten Body-Text
  if (!areaSqm) {
    const areaMatch = findTextByPattern(/\d{2,4}(?:,\d)?\s*m²/);
    if (areaMatch) areaSqm = parseArea(areaMatch) ?? undefined;
  }
  if (!rooms) {
    const roomMatch = findTextByPattern(/\d(?:,5)?\s*Zimmer/i);
    if (roomMatch) rooms = parseRooms(roomMatch) ?? undefined;
  }

  debugLog("Fläche:", areaSqm, "Zimmer:", rooms);

  // Listing-Typ
  const breadcrumb = safeQueryFirst(".breadcrump-link", "[class*='breadcrumb']", "nav a") ?? "";
  const listingType = detectListingType(`${breadcrumb} ${priceText ?? ""}`, window.location.href);

  // An Background senden
  sendToBackground({
    portal: "kleinanzeigen",
    externalId,
    url: window.location.href,
    title: title.substring(0, 100),
    location,
    price,
    areaSqm,
    rooms,
    listingType,
    address: location,
  });
});
