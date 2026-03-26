/**
 * Content Script für immobilienscout24.de
 *
 * RISIKOBEWERTUNG: HOCH — "Data Extraction" verboten, bis €50.000 Vertragsstrafe.
 *
 * Strategie: Mehrere Erkennungsmethoden, da IS24 das Layout häufig ändert.
 * 1. JSON-LD Structured Data (schema.org) — zuverlässigste Methode
 * 2. DOM-Selektoren (data-is24-qa Attribute + Klassen)
 * 3. Body-Text Regex als letzter Fallback
 */

import type { ListingMessage } from "../types";
import { parseGermanPrice, parseArea, parseRooms, detectListingType } from "../utils/price-parser";

// ============================================================
// Hilfsfunktionen
// ============================================================

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

function send(data: ListingMessage["data"]): void {
  try {
    chrome.runtime.sendMessage({ type: "LISTING_DETECTED", data } as ListingMessage);
    console.debug("[SchweizerMakler] IS24 Listing erkannt:", data.title, data.price, "€");
  } catch {
    // Extension context ungültig
  }
}

// ============================================================
// Methode 1: JSON-LD Structured Data
// ============================================================

interface JsonLdData {
  price?: number;
  title?: string;
  location?: string;
  area?: number;
  rooms?: number;
  listingType?: "miete" | "kauf";
}

function tryJsonLd(): JsonLdData | null {
  try {
    const scripts = Array.from(document.querySelectorAll('script[type="application/ld+json"]'));
    for (const script of scripts) {
      const text = script.textContent;
      if (!text) continue;

      const data = JSON.parse(text);
      const items = Array.isArray(data) ? data : [data];

      for (const item of items) {
        // Schema.org RealEstateListing, Residence, Offer, Product
        const price =
          item.offers?.price ??
          item.offers?.lowPrice ??
          item.price ??
          item.offers?.[0]?.price;

        if (price) {
          const numPrice = typeof price === "string" ? parseGermanPrice(price) : Number(price);
          if (numPrice && numPrice > 0) {
            console.debug("[SchweizerMakler] IS24: Preis via JSON-LD gefunden:", numPrice);
            return {
              price: numPrice,
              title: item.name ?? item.headline ?? undefined,
              location: item.address?.addressLocality ?? item.address?.streetAddress ?? undefined,
              area: item.floorSize?.value ? Number(item.floorSize.value) : undefined,
              rooms: item.numberOfRooms ? Number(item.numberOfRooms) : undefined,
              listingType: item.offers?.priceCurrency === "EUR" && price < 5000 ? "miete" : "kauf",
            };
          }
        }
      }
    }
  } catch (e) {
    console.debug("[SchweizerMakler] IS24: JSON-LD Parsing Fehler:", e);
  }
  return null;
}

// ============================================================
// Methode 2: Meta-Tags
// ============================================================

function tryMetaTags(): { title?: string; description?: string } {
  const title =
    document.querySelector('meta[property="og:title"]')?.getAttribute("content") ??
    document.querySelector('meta[name="title"]')?.getAttribute("content") ??
    undefined;
  const description =
    document.querySelector('meta[property="og:description"]')?.getAttribute("content") ??
    document.querySelector('meta[name="description"]')?.getAttribute("content") ??
    undefined;
  return { title, description };
}

// ============================================================
// Methode 3: DOM-Selektoren
// ============================================================

function tryDomSelectors(): { price: number | null; title: string; location: string; area?: number; rooms?: number } {
  // Preis — alle bekannten IS24 Selektoren + generische
  const priceText = readFirst(
    // IS24-spezifische data Attribute
    "[data-is24-qa='is24qa-kaltmiete']",
    "[data-is24-qa='is24qa-kaufpreis']",
    "[data-is24-qa='is24qa-gesamtmiete']",
    "[data-is24-qa='is24qa-warmmiete']",
    // Klassen (IS24 nutzt CSS Modules mit Hashes, aber auch semantische Klassen)
    "[class*='Price'] [class*='Value']",
    "[class*='price'] [class*='value']",
    "[class*='Price'][class*='Value']",
    "[class*='HeaderPrice']",
    "[class*='headerPrice']",
    "[class*='priceValue']",
    "[class*='price-value']",
    ".is24-price-value",
    // Generische Container
    "div[class*='price'] span",
    "span[class*='price']",
    "span[class*='Price']",
    "div[class*='Price'] span",
    // Aria
    "[aria-label*='Kaufpreis']",
    "[aria-label*='Kaltmiete']",
    "[aria-label*='Warmmiete']",
    "[aria-label*='Preis']",
    "[aria-label*='preis']",
  );

  const price = parseGermanPrice(priceText ?? "");

  // Titel
  const title = readFirst(
    "#expose-title",
    "[data-is24-qa='expose-title']",
    "h1[class*='Title']",
    "h1[class*='title']",
    "h1",
  ) ?? "";

  // Ort
  const location = readFirst(
    "[data-is24-qa='is24qa-strasse']",
    "[data-is24-qa='expose-address']",
    "[class*='address'] span",
    "[class*='Address']",
    "span[class*='zip-city']",
    "[class*='addressBlock']",
  ) ?? "";

  // Fläche
  const areaText = readFirst(
    "[data-is24-qa='is24qa-flaeche']",
    "[data-is24-qa='is24qa-wohnflaeche']",
    "[class*='livingSpace']",
    "[class*='LivingSpace']",
  );
  const area = parseArea(areaText ?? "") ?? undefined;

  // Zimmer
  const roomsText = readFirst(
    "[data-is24-qa='is24qa-zi']",
    "[data-is24-qa='is24qa-zimmer']",
    "[class*='numberOfRooms']",
    "[class*='NumberOfRooms']",
  );
  const rooms = parseRooms(roomsText ?? "") ?? undefined;

  return { price, title, location, area, rooms };
}

// ============================================================
// Methode 4: Body-Text Regex (aggressivster Fallback)
// ============================================================

function findPriceInBody(): number | null {
  const text = document.body?.innerText ?? "";

  // Verschiedene Preisformate die IS24 nutzen könnte
  const patterns = [
    /(\d{1,3}(?:\.\d{3})+(?:,\d{2})?)\s*€/,          // 299.000 € oder 299.000,00 €
    /(\d{1,3}(?:\.\d{3})+(?:,\d{2})?)\s*EUR/i,        // 299.000 EUR
    /€\s*(\d{1,3}(?:\.\d{3})+(?:,\d{2})?)/,           // € 299.000
    /Kaufpreis[:\s]*(\d{1,3}(?:\.\d{3})+(?:,\d{2})?)/i,  // Kaufpreis: 299.000
    /Kaltmiete[:\s]*(\d{1,3}(?:[\.,]\d{2,3})*)/i,        // Kaltmiete: 1.200
    /Warmmiete[:\s]*(\d{1,3}(?:[\.,]\d{2,3})*)/i,        // Warmmiete: 1.400
    /(\d{2,3}(?:,\d{2})?)\s*€\s*\/\s*Monat/i,           // 1.200 € / Monat
    /(\d{1,3}(?:\.\d{3})+)\s/,                            // 299.000 (ohne €, als letzter Fallback)
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      const price = parseGermanPrice(match[1] || match[0]);
      if (price && price > 10) { // Mindestens 10€ um Hausnummern etc. auszuschließen
        console.debug("[SchweizerMakler] IS24: Preis via Body-Regex gefunden:", price, "Pattern:", pattern.source);
        return price;
      }
    }
  }
  return null;
}

function findTitleInBody(): string {
  // Fallback: h1 oder og:title
  const meta = tryMetaTags();
  return meta.title ?? read("h1") ?? "";
}

function findAreaInBody(): number | null {
  const text = document.body?.innerText ?? "";
  const match = text.match(/(\d{2,4}(?:,\d{1,2})?)\s*m²/);
  return match ? parseArea(match[0]) : null;
}

function findRoomsInBody(): number | null {
  const text = document.body?.innerText ?? "";
  const match = text.match(/(\d(?:,5)?)\s*(?:Zimmer|Zi\.)/i);
  return match ? parseRooms(match[0]) : null;
}

// ============================================================
// Hauptlogik mit Retry
// ============================================================

function tryExtract(): boolean {
  if (!window.location.pathname.includes("/expose/")) return false;

  const idMatch = window.location.pathname.match(/\/expose\/(\d+)/);
  if (!idMatch) return false;
  const externalId = idMatch[1];

  // Methode 1: JSON-LD (am zuverlässigsten)
  const jsonLd = tryJsonLd();
  if (jsonLd?.price) {
    const title = jsonLd.title ?? findTitleInBody();
    const location = jsonLd.location ?? readFirst("[class*='address']", "[class*='Address']") ?? "";

    send({
      portal: "immoscout",
      externalId,
      url: window.location.href,
      title: (title || "IS24 Exposé").substring(0, 100),
      location,
      price: jsonLd.price,
      areaSqm: jsonLd.area,
      rooms: jsonLd.rooms,
      listingType: jsonLd.listingType ?? detectListingType("", window.location.href),
      address: location,
    });
    return true;
  }

  // Methode 2: DOM-Selektoren
  const dom = tryDomSelectors();
  if (dom.price) {
    console.debug("[SchweizerMakler] IS24: Preis via DOM-Selektor gefunden:", dom.price);
    send({
      portal: "immoscout",
      externalId,
      url: window.location.href,
      title: (dom.title || findTitleInBody() || "IS24 Exposé").substring(0, 100),
      location: dom.location,
      price: dom.price,
      areaSqm: dom.area,
      rooms: dom.rooms,
      listingType: detectListingType("", window.location.href),
      address: dom.location,
    });
    return true;
  }

  // Methode 3: Body-Text Regex
  const bodyPrice = findPriceInBody();
  if (bodyPrice) {
    const title = findTitleInBody();
    send({
      portal: "immoscout",
      externalId,
      url: window.location.href,
      title: (title || "IS24 Exposé").substring(0, 100),
      location: "",
      price: bodyPrice,
      areaSqm: findAreaInBody() ?? undefined,
      rooms: findRoomsInBody() ?? undefined,
      listingType: detectListingType("", window.location.href),
    });
    return true;
  }

  // DEBUG: Detaillierte Analyse der Seite loggen
  debugDumpPage();
  return false;
}

function debugDumpPage(): void {
  console.debug("[SchweizerMakler] IS24 DEBUG — Seiten-Analyse:");

  // 1. JSON-LD
  const ldScripts = Array.from(document.querySelectorAll('script[type="application/ld+json"]'));
  console.debug("[SM-DEBUG] JSON-LD Scripts gefunden:", ldScripts.length);
  ldScripts.forEach((s, i) => {
    try { console.debug(`[SM-DEBUG] JSON-LD #${i}:`, JSON.parse(s.textContent ?? "")); } catch { /* */ }
  });

  // 2. Meta-Tags
  const metas = Array.from(document.querySelectorAll("meta")).filter(m =>
    m.getAttribute("property")?.includes("og:") || m.getAttribute("name")?.includes("description")
  );
  metas.forEach(m => console.debug("[SM-DEBUG] Meta:", m.getAttribute("property") ?? m.getAttribute("name"), "=", m.getAttribute("content")?.substring(0, 100)));

  // 3. Alle Texte mit € oder EUR
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  const priceTexts: string[] = [];
  let node;
  while (node = walker.nextNode()) {
    const text = (node.textContent ?? "").trim();
    if (text.match(/\d.*[€]|EUR/i) && text.length < 200) {
      priceTexts.push(text);
    }
  }
  console.debug("[SM-DEBUG] Texte mit €/EUR:", priceTexts);

  // 4. Alle h1, h2 Elemente
  const headings = Array.from(document.querySelectorAll("h1, h2")).map(h => h.textContent?.trim()).filter(Boolean);
  console.debug("[SM-DEBUG] Überschriften:", headings);

  // 5. Alle data-is24-qa Attribute
  const is24qa = Array.from(document.querySelectorAll("[data-is24-qa]")).map(el => ({
    qa: el.getAttribute("data-is24-qa"),
    text: el.textContent?.trim()?.substring(0, 80),
    tag: el.tagName,
  }));
  console.debug("[SM-DEBUG] data-is24-qa Elemente:", is24qa);

  // 6. Alle data-testid Attribute
  const testids = Array.from(document.querySelectorAll("[data-testid]")).map(el => ({
    testid: el.getAttribute("data-testid"),
    text: el.textContent?.trim()?.substring(0, 80),
    tag: el.tagName,
  }));
  console.debug("[SM-DEBUG] data-testid Elemente:", testids.slice(0, 30));

  // 7. document.title
  console.debug("[SM-DEBUG] document.title:", document.title);

  // 8. Body Text auszug (erste 500 Zeichen)
  console.debug("[SM-DEBUG] Body text (500 chars):", document.body?.innerText?.substring(0, 500));
}

// Retry: IS24 ist eine React SPA, Inhalte laden dynamisch
let attempt = 0;
const maxAttempts = 6;

function tryWithDelay(): void {
  attempt++;
  // Schnelle Versuche: 300ms, 600ms, 1s, 1.5s, 2s, 2.5s
  const delay = Math.min(attempt * 300, 2500) + Math.random() * 200;

  setTimeout(() => {
    console.debug(`[SchweizerMakler] IS24: Versuch ${attempt}/${maxAttempts}...`);
    const success = tryExtract();

    if (!success && attempt < maxAttempts) {
      tryWithDelay();
    } else if (!success) {
      console.debug("[SchweizerMakler] IS24: Alle Versuche fehlgeschlagen — Seite nicht parsebar.");
    }
  }, delay);
}

if (window.location.pathname.includes("/expose/")) {
  console.debug("[SchweizerMakler] IS24 Content Script aktiv auf:", window.location.href);
  // Sofort versuchen (DOM könnte schon fertig sein)
  if (!tryExtract()) {
    tryWithDelay();
  }
}
