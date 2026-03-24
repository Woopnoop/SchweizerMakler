/**
 * Gemeinsame Basis für alle Content Scripts.
 *
 * KRITISCH — RECHTLICHE EINSCHRÄNKUNGEN:
 * - KEIN DOM verändern (createElement, innerHTML, classList, style)
 * - KEINE CSS injizieren
 * - KEINE fetch/XMLHttpRequest an Portal-Domains
 * - KEINE Event Listener auf window/document (außer initiales Idle-Callback)
 * - Alle DOM-Reads über requestIdleCallback/setTimeout mit random Timing
 */

import type { ListingMessage } from "../types";

/**
 * Anti-Detection: DOM-Read erst ausführen wenn der Browser idle ist.
 * Zufälliges Timing verhindert Fingerprinting.
 */
export function waitForIdle(callback: () => void): void {
  if ("requestIdleCallback" in window) {
    requestIdleCallback(callback, { timeout: 3000 });
  } else {
    setTimeout(callback, 500 + Math.random() * 1000);
  }
}

/**
 * Sicherer DOM-Read: gibt textContent des Elements zurück oder null.
 * Wirft NIEMALS einen Fehler.
 */
export function safeQuery(selector: string): string | null {
  try {
    const el = document.querySelector(selector);
    return el?.textContent?.trim() || null;
  } catch {
    return null;
  }
}

/**
 * Sicherer DOM-Read: gibt das Element selbst zurück (für Attribut-Reads).
 */
export function safeQueryElement(selector: string): Element | null {
  try {
    return document.querySelector(selector);
  } catch {
    return null;
  }
}

/**
 * Alle Elemente mit Selektor abfragen.
 */
export function safeQueryAll(selector: string): Element[] {
  try {
    return Array.from(document.querySelectorAll(selector));
  } catch {
    return [];
  }
}

/**
 * Daten an den Background Service Worker senden.
 * Fehler werden verschluckt (Extension-Context kann ungültig sein).
 */
export function sendToBackground(data: ListingMessage["data"]): void {
  try {
    chrome.runtime.sendMessage({
      type: "LISTING_DETECTED",
      data,
    } satisfies ListingMessage);
  } catch {
    // Extension context invalidated — silently fail
  }
}

/**
 * External ID aus einer URL extrahieren (letztes numerisches Segment).
 */
export function extractIdFromUrl(url: string): string | null {
  const match = url.match(/(\d{5,})/);
  return match ? match[1] : null;
}
