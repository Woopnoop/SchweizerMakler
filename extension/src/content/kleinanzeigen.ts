/**
 * Content Script für kleinanzeigen.de
 *
 * Liest Anzeigendaten von Detailseiten (/s-anzeige/).
 * KEIN DOM wird verändert. Nur querySelector zum Lesen.
 *
 * Risikobewertung: GERING — AGB verbieten nur Bots/Crawler, kein Plugin-Verbot.
 */

import { waitForIdle, safeQuery, safeQueryAll, sendToBackground, extractIdFromUrl } from "./base-parser";
import { parseGermanPrice, parseArea, parseRooms, detectListingType } from "../utils/price-parser";

waitForIdle(() => {
  // Nur auf Detailseiten aktiv
  if (!window.location.pathname.includes("/s-anzeige/")) return;

  // Preis
  const priceText = safeQuery("#viewad-price") ?? safeQuery("[itemprop='price']");
  const price = parseGermanPrice(priceText ?? "");
  if (!price) return; // Ohne Preis kein Tracking

  // Titel
  const title = safeQuery("#viewad-title") ?? safeQuery("h1") ?? "";
  if (!title) return;

  // Ort
  const location = safeQuery("#viewad-locality") ?? safeQuery("[itemprop='locality']") ?? "";

  // External ID
  const externalId = extractIdFromUrl(window.location.pathname);
  if (!externalId) return;

  // Fläche und Zimmer aus den Attribut-Feldern
  let areaSqm: number | undefined;
  let rooms: number | undefined;

  const detailItems = safeQueryAll("#viewad-details .addetailslist--detail");
  for (const item of detailItems) {
    const text = item.textContent ?? "";
    if (text.includes("m²") || text.includes("qm")) {
      areaSqm = parseArea(text) ?? undefined;
    }
    if (text.includes("Zimmer") || text.includes("Zi")) {
      rooms = parseRooms(text) ?? undefined;
    }
  }

  // Listing-Typ
  const breadcrumb = safeQuery(".breadcrump-link") ?? "";
  const listingType = detectListingType(`${breadcrumb} ${priceText}`, window.location.href);

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
  });
});
