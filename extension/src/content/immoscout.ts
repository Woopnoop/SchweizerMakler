/**
 * Content Script für immobilienscout24.de
 *
 * RISIKOBEWERTUNG: HOCH
 * - "Data Extraction" in AGB verboten, Vertragsstrafe bis €50.000
 * - Akamai Bot Manager aktiv — Content Script in ISOLATED world ist jedoch
 *   für Akamai unsichtbar (separater JS-Context, kein Zugriff von der Seite)
 * - IT-Rechtsanwalt Konsultation vor kommerziellem Einsatz empfohlen
 *
 * SICHERHEITSMASSNAHMEN:
 * 1. KEIN DOM verändern (kein createElement, innerHTML, classList, style)
 * 2. KEINE HTTP-Requests an immobilienscout24.de
 * 3. KEINE Event Listener auf window/document
 * 4. Zufälliges Timing (2-5 Sekunden Delay) statt fester Patterns
 * 5. Nur ein einziger Durchlauf — kein MutationObserver, kein Polling
 * 6. Minimale Selektoren — so wenig DOM-Reads wie möglich
 */

import type { ListingMessage } from "../types";
import { parseGermanPrice, parseArea, parseRooms, detectListingType } from "../utils/price-parser";

// Eigener waitForIdle mit extra langem, zufälligem Delay für IS24
function waitForIdleSafe(callback: () => void): void {
  // 2-5 Sekunden zufälliger Delay — kein deterministisches Pattern
  const delay = 2000 + Math.random() * 3000;
  setTimeout(callback, delay);
}

// Minimaler, sicherer DOM-Read
function read(selector: string): string | null {
  try {
    return document.querySelector(selector)?.textContent?.trim() || null;
  } catch {
    return null;
  }
}

// Einmalig an Background senden, dann nichts mehr tun
function send(data: ListingMessage["data"]): void {
  try {
    chrome.runtime.sendMessage({ type: "LISTING_DETECTED", data } as ListingMessage);
  } catch {
    // Extension context ungültig — still ignorieren
  }
}

waitForIdleSafe(() => {
  // Nur auf Exposé-Detailseiten aktiv
  if (!window.location.pathname.includes("/expose/")) return;

  // External ID aus URL: /expose/123456789
  const idMatch = window.location.pathname.match(/\/expose\/(\d+)/);
  if (!idMatch) return;
  const externalId = idMatch[1];

  // Preis — IS24 nutzt verschiedene Selektoren je nach Objekttyp
  const priceText =
    read("[data-is24-qa='is24qa-kaltmiete']") ??
    read("[data-is24-qa='is24qa-kaufpreis']") ??
    read("[data-is24-qa='is24qa-gesamtmiete']") ??
    read(".is24-price-value") ??
    read("[class*='price'] [class*='value']");
  const price = parseGermanPrice(priceText ?? "");
  if (!price) return; // Ohne Preis kein Tracking

  // Titel
  const title =
    read("#expose-title") ??
    read("h1[data-is24-qa='expose-title']") ??
    read("h1") ??
    "";
  if (!title) return;

  // Ort
  const location =
    read("[data-is24-qa='is24qa-strasse']") ??
    read(".address-block span") ??
    read("[class*='address']") ??
    "";

  // Fläche
  const areaText =
    read("[data-is24-qa='is24qa-flaeche']") ??
    read("[data-is24-qa='is24qa-wohnflaeche']") ??
    "";
  const areaSqm = parseArea(areaText) ?? undefined;

  // Zimmer
  const roomsText =
    read("[data-is24-qa='is24qa-zi']") ??
    read("[data-is24-qa='is24qa-zimmer']") ??
    "";
  const rooms = parseRooms(roomsText) ?? undefined;

  // Listing-Typ
  const listingType = detectListingType(priceText ?? "", window.location.href);

  // Einmalig senden — danach ist dieses Script fertig
  send({
    portal: "immoscout",
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
