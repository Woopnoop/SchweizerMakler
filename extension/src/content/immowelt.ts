/**
 * Content Script für immowelt.de
 *
 * Risikobewertung: MITTEL — § 9.3 AGB: "jenseits privater Benutzung" verboten.
 * Bei privater Nutzung vertretbar.
 *
 * Immowelt lädt Inhalte dynamisch per JavaScript nach (React SPA).
 * Strategie: Retry mit mehreren Erkennungsmethoden.
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

function send(data: ListingMessage["data"]): void {
  try {
    chrome.runtime.sendMessage({ type: "LISTING_DETECTED", data } as ListingMessage);
    console.log("[SchweizerMakler] Immowelt Listing erkannt:", data.title, data.price, "€");
  } catch { /* */ }
}

// ============================================================
// JSON-LD
// ============================================================

function tryJsonLd(): { price: number; title?: string; location?: string; area?: number; rooms?: number; type?: "miete" | "kauf" } | null {
  try {
    const scripts = Array.from(document.querySelectorAll('script[type="application/ld+json"]'));
    for (const script of scripts) {
      const text = script.textContent;
      if (!text) continue;
      const data = JSON.parse(text);
      const items = Array.isArray(data) ? data : [data];

      for (const item of items) {
        const price = item.offers?.price ?? item.price ?? item.offers?.[0]?.price;
        if (price) {
          const numPrice = typeof price === "string" ? parseGermanPrice(price) : Number(price);
          if (numPrice && numPrice > 0) {
            console.log("[SchweizerMakler] Immowelt: Preis via JSON-LD:", numPrice);
            return {
              price: numPrice,
              title: item.name ?? item.headline,
              location: item.address?.addressLocality ?? item.address?.streetAddress,
              area: item.floorSize?.value ? Number(item.floorSize.value) : undefined,
              rooms: item.numberOfRooms ? Number(item.numberOfRooms) : undefined,
              type: numPrice < 5000 ? "miete" : "kauf",
            };
          }
        }
      }
    }
  } catch { /* */ }
  return null;
}

// ============================================================
// DOM-Selektoren
// ============================================================

function tryDom(): { price: number | null; title: string; location: string; area?: number; rooms?: number } {
  const priceText = readFirst(
    // Immowelt-spezifische Selektoren
    "[data-testid='price']",
    "[data-testid='Price']",
    "[class*='hardfact'][class*='price']",
    "[class*='hardfacts'] [class*='price']",
    "[class*='KeyFacts'] [class*='price']",
    "[class*='keyfacts'] [class*='price']",
    "[class*='Price'] strong",
    "[class*='price'] strong",
    "div[class*='price']",
    "span[class*='price']",
    "[class*='mainPrice']",
    "[class*='MainPrice']",
    "[class*='Preis']",
    "[aria-label*='Kaufpreis']",
    "[aria-label*='Kaltmiete']",
    "[aria-label*='Preis']",
    // Generisch
    "h2[class*='price']",
    ".has-font-300",
  );

  const price = parseGermanPrice(priceText ?? "");

  const title = readFirst(
    "[data-testid='title']",
    "h1[class*='Title']",
    "h1[class*='title']",
    "[class*='expose--title']",
    "[class*='ExposeTitle']",
    "h1",
  ) ?? "";

  const location = readFirst(
    "[data-testid='address']",
    "[class*='location']",
    "[class*='Location']",
    "[class*='address']",
    "[class*='Address']",
    "[class*='expose--location']",
    ".location span",
  ) ?? "";

  const areaText = readFirst(
    "[data-testid='area']",
    "[class*='hardfact'][class*='area']",
    "[class*='area'] span",
    "[class*='Area']",
    "[aria-label*='Wohnfläche']",
    "[aria-label*='Fläche']",
  );
  const area = parseArea(areaText ?? "") ?? undefined;

  const roomsText = readFirst(
    "[data-testid='rooms']",
    "[class*='hardfact'][class*='rooms']",
    "[class*='rooms'] span",
    "[class*='Rooms']",
    "[aria-label*='Zimmer']",
  );
  const rooms = parseRooms(roomsText ?? "") ?? undefined;

  return { price, title, location, area, rooms };
}

// ============================================================
// Body-Text Regex
// ============================================================

function findPriceInBody(): number | null {
  const text = document.body?.innerText ?? "";
  const patterns = [
    /(\d{1,3}(?:\.\d{3})+(?:,\d{2})?)\s*€/,
    /(\d{1,3}(?:\.\d{3})+(?:,\d{2})?)\s*EUR/i,
    /€\s*(\d{1,3}(?:\.\d{3})+(?:,\d{2})?)/,
    /Kaufpreis[:\s]*(\d{1,3}(?:\.\d{3})+(?:,\d{2})?)/i,
    /Kaltmiete[:\s]*(\d{1,3}(?:[\.,]\d{2,3})*)/i,
  ];
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      const price = parseGermanPrice(match[1] || match[0]);
      if (price && price > 10) {
        console.log("[SchweizerMakler] Immowelt: Preis via Body-Regex:", price);
        return price;
      }
    }
  }
  return null;
}

// ============================================================
// Debug
// ============================================================

function debugDump(): void {
  console.log("[SchweizerMakler] Immowelt DEBUG:");
  console.log("[SM-DEBUG] document.title:", document.title);
  console.log("[SM-DEBUG] URL:", window.location.href);

  const ld = Array.from(document.querySelectorAll('script[type="application/ld+json"]'));
  console.log("[SM-DEBUG] JSON-LD:", ld.length);
  ld.forEach((s, i) => { try { console.log(`[SM-DEBUG] LD#${i}:`, JSON.parse(s.textContent ?? "")); } catch { /* */ } });

  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  const prices: string[] = [];
  let node;
  while (node = walker.nextNode()) {
    const t = (node.textContent ?? "").trim();
    if (t.match(/\d.*€|EUR/i) && t.length < 200) prices.push(t);
  }
  console.log("[SM-DEBUG] Texte mit €:", prices);

  const headings = Array.from(document.querySelectorAll("h1, h2")).map(h => h.textContent?.trim()).filter(Boolean);
  console.log("[SM-DEBUG] Überschriften:", headings);

  const testids = Array.from(document.querySelectorAll("[data-testid]")).slice(0, 20).map(el => ({
    id: el.getAttribute("data-testid"),
    text: el.textContent?.trim()?.substring(0, 60),
  }));
  console.log("[SM-DEBUG] data-testid:", testids);

  console.log("[SM-DEBUG] Body (500):", document.body?.innerText?.substring(0, 500));
}

// ============================================================
// Hauptlogik
// ============================================================

function tryExtract(): boolean {
  // Nur auf Exposé-Seiten
  const path = window.location.pathname;
  if (!path.includes("/expose/") && !path.match(/\/[a-z0-9]{6,}/i)) return false;

  // External ID aus URL
  const idMatch = path.match(/\/expose\/([a-zA-Z0-9]+)/) || path.match(/\/([a-zA-Z0-9]{6,})$/);
  if (!idMatch) return false;
  const externalId = idMatch[1];

  // Methode 1: JSON-LD
  const jsonLd = tryJsonLd();
  if (jsonLd) {
    send({
      portal: "immowelt",
      externalId,
      url: window.location.href,
      title: (jsonLd.title ?? read("h1") ?? "Immowelt Exposé").substring(0, 100),
      location: jsonLd.location ?? "",
      price: jsonLd.price,
      areaSqm: jsonLd.area,
      rooms: jsonLd.rooms,
      listingType: jsonLd.type ?? detectListingType("", window.location.href),
      address: jsonLd.location,
    });
    return true;
  }

  // Methode 2: DOM-Selektoren
  const dom = tryDom();
  if (dom.price) {
    console.log("[SchweizerMakler] Immowelt: Preis via DOM:", dom.price);
    send({
      portal: "immowelt",
      externalId,
      url: window.location.href,
      title: (dom.title || read("h1") || "Immowelt Exposé").substring(0, 100),
      location: dom.location,
      price: dom.price,
      areaSqm: dom.area,
      rooms: dom.rooms,
      listingType: detectListingType(dom.title, window.location.href),
      address: dom.location,
    });
    return true;
  }

  // Methode 3: Body-Text Regex
  const bodyPrice = findPriceInBody();
  if (bodyPrice) {
    const title = read("h1") ?? document.title ?? "Immowelt Exposé";
    send({
      portal: "immowelt",
      externalId,
      url: window.location.href,
      title: title.substring(0, 100),
      location: "",
      price: bodyPrice,
      listingType: detectListingType("", window.location.href),
    });
    return true;
  }

  debugDump();
  return false;
}

// Retry (Immowelt lädt per JS nach)
let attempt = 0;
const maxAttempts = 5;

function tryWithDelay(): void {
  attempt++;
  const delay = 1500 + Math.random() * 1500 + attempt * 1000;

  setTimeout(() => {
    console.log(`[SchweizerMakler] Immowelt: Versuch ${attempt}/${maxAttempts}...`);
    const success = tryExtract();

    if (!success && attempt < maxAttempts) {
      tryWithDelay();
    } else if (!success) {
      console.log("[SchweizerMakler] Immowelt: Alle Versuche fehlgeschlagen.");
    }
  }, delay);
}

// Start
const path = window.location.pathname;
if (path.includes("/expose/") || path.match(/\/[a-z0-9]{6,}$/i)) {
  console.log("[SchweizerMakler] Immowelt Content Script aktiv auf:", window.location.href);
  tryWithDelay();
}
