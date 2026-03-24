/**
 * Content Script für wg-gesucht.de
 *
 * Liest Anzeigendaten von Detailseiten.
 * KEIN DOM wird verändert. Nur querySelector zum Lesen.
 *
 * Risikobewertung: GERING — Keine spezifischen Plugin-Verbote.
 */

import {
  waitForIdle, safeQuery, safeQueryFirst, safeQueryAll,
  sendToBackground, extractIdFromUrl, findTextByPattern, debugLog,
} from "./base-parser";
import { parseGermanPrice, parseArea, parseRooms, detectListingType } from "../utils/price-parser";

waitForIdle(() => {
  debugLog("WG-Gesucht Content Script aktiv auf:", window.location.href);

  // Detailseiten haben numerische IDs
  const externalId = extractIdFromUrl(window.location.pathname);
  if (!externalId) {
    debugLog("Keine numerische ID in URL — keine Detailseite.");
    return;
  }

  // Detailseite erkennen (verschiedene Muster)
  const path = window.location.pathname;
  const isDetailPage =
    path.includes("/wg-zimmer-in") ||
    path.includes("/1-zimmer-wohnungen-in") ||
    path.includes("/wohnungen-in") ||
    path.includes("/haeuser-in") ||
    path.includes("/zimmer-in") ||
    document.querySelector("h1[class*='headline']") !== null ||
    document.querySelector("[id*='main_column']") !== null;

  if (!isDetailPage) {
    debugLog("Keine Detailseite erkannt.");
    return;
  }

  // Preis
  const priceText = safeQueryFirst(
    ".miete",
    "[class*='price']",
    "[class*='Price']",
    ".headline-key-facts b",
    "[id*='rent']",
    "[class*='rent']",
    "[class*='miete']",
    "[class*='cost']",
  );

  const priceSource = priceText ?? findTextByPattern(/\d{2,4}(?:,\d{2})?\s*€/);
  const price = parseGermanPrice(priceSource ?? "");
  debugLog("Preis:", priceSource, "→", price);

  if (!price) {
    debugLog("KEIN PREIS gefunden.");
    return;
  }

  // Titel
  const title = safeQueryFirst(
    "h1.headline-detailed-view-title",
    "h1[class*='headline']",
    "h1[class*='title']",
    "#sltte",
    "h1",
  ) ?? "";

  debugLog("Titel:", title);
  if (!title) return;

  // Ort
  const location = safeQueryFirst(
    ".col-sm-4.text-right a",
    "[class*='address']",
    "[class*='location']",
    ".headline-detailed-view-title + div",
    "[id*='map'] + *",
    "a[href*='stadt']",
  ) ?? "";
  debugLog("Ort:", location);

  // Fläche und Zimmer
  let areaSqm: number | undefined;
  let rooms: number | undefined;

  const detailRows = [
    ...safeQueryAll(".headline-key-facts .key-fact-title"),
    ...safeQueryAll(".headline-key-facts b"),
    ...safeQueryAll("table.table td"),
    ...safeQueryAll("[class*='detail'] td"),
    ...safeQueryAll("[class*='detail'] span"),
    ...safeQueryAll("[class*='fact']"),
  ];

  for (const row of detailRows) {
    const text = row.textContent ?? "";
    if (!areaSqm && (text.includes("m²") || text.includes("qm") || text.includes("Größe"))) {
      areaSqm = parseArea(text) ?? undefined;
    }
    if (!rooms && (text.includes("Zimmer") || text.includes("Zi"))) {
      rooms = parseRooms(text) ?? undefined;
    }
  }

  // Fallback: Body-Text
  if (!areaSqm) {
    const m = findTextByPattern(/\d{2,3}(?:,\d)?\s*m²/);
    if (m) areaSqm = parseArea(m) ?? undefined;
  }

  debugLog("Fläche:", areaSqm, "Zimmer:", rooms);

  const listingType = detectListingType("", window.location.href);

  sendToBackground({
    portal: "wg-gesucht",
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
