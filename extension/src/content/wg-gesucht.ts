/**
 * Content Script für wg-gesucht.de
 *
 * Liest Anzeigendaten von Detailseiten.
 * KEIN DOM wird verändert. Nur querySelector zum Lesen.
 *
 * Risikobewertung: GERING — Keine spezifischen Plugin-Verbote.
 */

import { waitForIdle, safeQuery, safeQueryAll, sendToBackground, extractIdFromUrl } from "./base-parser";
import { parseGermanPrice, parseArea, parseRooms, detectListingType } from "../utils/price-parser";

waitForIdle(() => {
  // WG-Gesucht Detailseiten haben numerische IDs in der URL
  const externalId = extractIdFromUrl(window.location.pathname);
  if (!externalId) return;

  // Sicherstellen dass wir auf einer Detailseite sind (nicht Suchergebnisse)
  const isDetailPage =
    window.location.pathname.includes("/wg-zimmer-in") ||
    window.location.pathname.includes("/1-zimmer-wohnungen-in") ||
    window.location.pathname.includes("/wohnungen-in") ||
    window.location.pathname.includes("/haeuser-in") ||
    document.querySelector(".headline-detailed-view-title") !== null;
  if (!isDetailPage) return;

  // Preis
  const priceText =
    safeQuery(".miete") ??
    safeQuery("[class*='price']") ??
    safeQuery(".headline-key-facts b");
  const price = parseGermanPrice(priceText ?? "");
  if (!price) return;

  // Titel
  const title =
    safeQuery("h1.headline-detailed-view-title") ??
    safeQuery("h1") ??
    "";
  if (!title) return;

  // Ort
  const location =
    safeQuery(".col-sm-4.text-right a") ??
    safeQuery("[class*='address']") ??
    safeQuery(".headline-detailed-view-title + div") ??
    "";

  // Fläche und Zimmer aus der Detail-Tabelle
  let areaSqm: number | undefined;
  let rooms: number | undefined;

  const detailRows = safeQueryAll(".headline-key-facts .key-fact-title, table.table td");
  for (const row of detailRows) {
    const text = row.textContent ?? "";
    if (text.includes("m²") || text.includes("qm") || text.includes("Größe")) {
      areaSqm = parseArea(text) ?? undefined;
    }
    if (text.includes("Zimmer") || text.includes("Zi")) {
      rooms = parseRooms(text) ?? undefined;
    }
  }

  // WG-Gesucht ist primär Miete
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
  });
});
