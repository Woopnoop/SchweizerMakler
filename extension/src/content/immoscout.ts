/**
 * Content Script für immobilienscout24.de
 *
 * RISIKOBEWERTUNG: HOCH
 * - "Data Extraction" in AGB verboten, Vertragsstrafe bis €50.000
 * - IT-Rechtsanwalt Konsultation vor kommerziellem Einsatz empfohlen
 *
 * SICHERHEITSMASSNAHMEN:
 * 1. KEIN DOM verändern
 * 2. KEINE HTTP-Requests an immobilienscout24.de
 * 3. Zufälliges Timing
 * 4. Nur DOM lesen, dann fertig
 *
 * IS24 ist eine SPA (React) — Inhalte werden dynamisch geladen.
 * Deshalb: Mehrere Versuche mit Wartezeit bis Preis im DOM erscheint.
 */

import type { ListingMessage } from "../types";
import { parseGermanPrice, parseArea, parseRooms, detectListingType } from "../utils/price-parser";

function read(selector: string): string | null {
  try {
    return document.querySelector(selector)?.textContent?.trim() || null;
  } catch {
    return null;
  }
}

function readFirst(...selectors: string[]): string | null {
  for (const sel of selectors) {
    const result = read(sel);
    if (result) return result;
  }
  return null;
}

function readAttr(selector: string, attr: string): string | null {
  try {
    return document.querySelector(selector)?.getAttribute(attr) || null;
  } catch {
    return null;
  }
}

function findPriceInPage(): string | null {
  // IS24 rendert Preise in verschiedenen Containern
  const body = document.body?.innerText ?? "";
  // Suche nach Preismustern: "299.000 €", "1.200 €", etc.
  const match = body.match(/(\d{1,3}(?:\.\d{3})*(?:,\d{2})?)\s*€/);
  return match ? match[0] : null;
}

function send(data: ListingMessage["data"]): void {
  try {
    chrome.runtime.sendMessage({ type: "LISTING_DETECTED", data } as ListingMessage);
    console.log("[SchweizerMakler] IS24 Listing erkannt:", data.title, data.price, "€");
  } catch {
    // Extension context ungültig
  }
}

function tryExtract(): boolean {
  // Nur auf Exposé-Detailseiten
  if (!window.location.pathname.includes("/expose/")) return false;

  const idMatch = window.location.pathname.match(/\/expose\/(\d+)/);
  if (!idMatch) return false;
  const externalId = idMatch[1];

  // Preis — viele Selektoren da IS24 das Layout häufig ändert
  const priceText = readFirst(
    // data-is24-qa Attribute
    "[data-is24-qa='is24qa-kaltmiete']",
    "[data-is24-qa='is24qa-kaufpreis']",
    "[data-is24-qa='is24qa-gesamtmiete']",
    "[data-is24-qa='is24qa-warmmiete']",
    // Klassen-basiert
    ".is24-price-value",
    "[class*='HeaderPrice']",
    "[class*='headerPrice']",
    "[class*='price-value']",
    "[class*='priceValue']",
    "[class*='Price'] [class*='Value']",
    "[class*='price'] [class*='value']",
    // Generische Preis-Container
    "div[class*='price'] span",
    "div[class*='Price'] span",
    "span[class*='price']",
    "span[class*='Price']",
    // Aria
    "[aria-label*='Kaufpreis']",
    "[aria-label*='Kaltmiete']",
    "[aria-label*='Warmmiete']",
  );

  // Letzter Fallback: Preis im gesamten Seitentext suchen
  const priceSource = priceText ?? findPriceInPage();
  const price = parseGermanPrice(priceSource ?? "");

  if (!price) {
    console.log("[SchweizerMakler] IS24: Kein Preis gefunden (Versuch fehlgeschlagen)");
    return false; // Retry
  }

  // Titel
  const title = readFirst(
    "#expose-title",
    "h1[data-is24-qa='expose-title']",
    "[data-is24-qa='expose-title']",
    "h1[class*='Title']",
    "h1[class*='title']",
    "h1",
  ) ?? "";

  if (!title) {
    console.log("[SchweizerMakler] IS24: Kein Titel gefunden");
    return false;
  }

  // Ort / Adresse
  const location = readFirst(
    "[data-is24-qa='is24qa-strasse']",
    "[data-is24-qa='expose-address']",
    ".address-block span",
    "[class*='address'] span",
    "[class*='Address'] span",
    "span[class*='zip-city']",
    "[class*='addressBlock']",
  ) ?? "";

  // Fläche
  const areaText = readFirst(
    "[data-is24-qa='is24qa-flaeche']",
    "[data-is24-qa='is24qa-wohnflaeche']",
    "[class*='livingSpace']",
    "[class*='area']",
  );
  const areaSqm = parseArea(areaText ?? "") ?? undefined;

  // Zimmer
  const roomsText = readFirst(
    "[data-is24-qa='is24qa-zi']",
    "[data-is24-qa='is24qa-zimmer']",
    "[class*='numberOfRooms']",
    "[class*='rooms']",
  );
  const rooms = parseRooms(roomsText ?? "") ?? undefined;

  // Typ
  const listingType = detectListingType(priceText ?? "", window.location.href);

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
    address: location,
  });

  return true; // Erfolg
}

// Retry-Logik: IS24 lädt Inhalte dynamisch nach (React SPA).
// Versuche bis zu 5x mit zunehmendem Delay.
let attempt = 0;
const maxAttempts = 5;

function tryWithDelay(): void {
  attempt++;
  const delay = 1500 + Math.random() * 1500 + attempt * 1000; // 2.5s, 4s, 5.5s, 7s, 8.5s

  setTimeout(() => {
    console.log(`[SchweizerMakler] IS24: Versuch ${attempt}/${maxAttempts}...`);
    const success = tryExtract();

    if (!success && attempt < maxAttempts) {
      tryWithDelay(); // Nächster Versuch
    } else if (!success) {
      console.log("[SchweizerMakler] IS24: Alle Versuche fehlgeschlagen — Seite nicht parsebar.");
    }
  }, delay);
}

// Starte den ersten Versuch
if (window.location.pathname.includes("/expose/")) {
  console.log("[SchweizerMakler] IS24 Content Script aktiv auf:", window.location.href);
  tryWithDelay();
}
