/**
 * Popup UI — Zeigt Listing-Daten, Preis-Chart und Standort-Score.
 */

import type { ListingStatus, TrackedListing, PortalStatistics, PriceChange, StandortScore } from "../types";
import { formatPrice, formatPriceChange, calculatePriceChange } from "../utils/diff";

// ============================================================
// Initialisierung
// ============================================================

document.addEventListener("DOMContentLoaded", async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.url) return;

  // Parallel laden: aktuelle Anzeige + alle Listings + Statistik
  const [statusResponse, allListings, stats] = await Promise.all([
    sendMessage({ type: "GET_CURRENT_LISTING", url: tab.url }),
    sendMessage({ type: "GET_ALL_LISTINGS" }),
    sendMessage({ type: "GET_STATISTICS" }),
  ]);

  const status = statusResponse as ListingStatus | null;
  if (status?.tracked && status.listing) {
    renderCurrentListing(status.listing, status.priceChange);
  }

  renderRecentChanges(allListings as TrackedListing[]);
  renderStatistics(stats as PortalStatistics);
});

// ============================================================
// Message Helper
// ============================================================

function sendMessage(message: unknown): Promise<unknown> {
  return chrome.runtime.sendMessage(message);
}

// ============================================================
// Aktuelle Anzeige
// ============================================================

function renderCurrentListing(listing: TrackedListing, priceChange?: PriceChange): void {
  show("current-listing");
  hide("no-listing");

  setText("listing-portal", listing.portal);
  setText("listing-title", listing.title);
  setText("listing-location", listing.location);

  const currentPrice = listing.priceHistory[listing.priceHistory.length - 1].price;
  const firstPrice = listing.priceHistory[0].price;
  setText("current-price", formatPrice(currentPrice));
  setText("first-price", formatPrice(firstPrice));

  setText("first-seen", formatDate(listing.firstSeen));
  setText("last-seen", formatDate(listing.lastSeen));

  // Preisänderung
  if (priceChange && priceChange.direction !== "unchanged") {
    show("price-change-row");
    const el = document.getElementById("price-change")!;
    el.textContent = formatPriceChange(priceChange);
    el.className = `price-change ${priceChange.direction}`;
  }

  // Chart
  if (listing.priceHistory.length >= 2) {
    renderChart(listing.priceHistory);
  }

  // Standort-Score
  if (listing.standortScore) {
    renderScore(listing.standortScore);
  }
}

// ============================================================
// Mini-Chart (SVG Polyline)
// ============================================================

function renderChart(history: Array<{ timestamp: number; price: number }>): void {
  show("chart-container");

  const svg = document.getElementById("price-chart")!;
  const width = 360;
  const height = 80;
  const padding = 8;

  const prices = history.map((h) => h.price);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const range = maxPrice - minPrice || 1;

  const points = history.map((h, i) => {
    const x = padding + ((width - 2 * padding) * i) / Math.max(history.length - 1, 1);
    const y = height - padding - ((h.price - minPrice) / range) * (height - 2 * padding);
    return `${x},${y}`;
  });

  svg.innerHTML = `
    <polyline points="${points.join(" ")}" />
    ${history.map((h, i) => {
      const x = padding + ((width - 2 * padding) * i) / Math.max(history.length - 1, 1);
      const y = height - padding - ((h.price - minPrice) / range) * (height - 2 * padding);
      return `<circle cx="${x}" cy="${y}" r="3" />`;
    }).join("")}
  `;
}

// ============================================================
// Standort-Score
// ============================================================

function renderScore(score: StandortScore): void {
  show("score-section");

  setText("score-total", String(score.gesamt));
  setBar("score-total-bar", score.gesamt);

  setText("score-familie", String(score.familie));
  setBar("score-familie-bar", score.familie);

  setText("score-oepnv", String(score.oepnv));
  setBar("score-oepnv-bar", score.oepnv);

  setText("score-aussicht", String(score.aussicht));
  setBar("score-aussicht-bar", score.aussicht);

  // Detail-Texte
  const fd = score.details.familie;
  setHtml("familie-details",
    `${fd.schulen} Schulen, ${fd.kindergaerten} Kitas, ${fd.parks} Parks, ` +
    `${fd.spielplaetze} Spielplätze, ${fd.sportplaetze} Sportanlagen, ` +
    `${fd.bibliotheken} Bibliotheken, ${fd.kultur} Kultureinrichtungen`
  );

  const od = score.details.oepnv;
  setHtml("oepnv-details",
    `${od.busHaltestellen} Bus, ${od.tramHaltestellen} Tram, ${od.bahnhoefe} Bahnhöfe` +
    (od.distanzHbfKm !== null ? `, ${od.distanzHbfKm} km zum Hbf` : "") +
    `, Dichte: ${od.haltestellenDichte300m} Haltestellen in 300m`
  );

  const ad = score.details.aussicht;
  const positive: string[] = [];
  const negative: string[] = [];
  if (ad.waldNaehe) positive.push("Wald");
  if (ad.gewaesserNaehe) positive.push("Gewässer");
  if (ad.grosserPark) positive.push("Park");
  if (ad.naturschutz) positive.push("Natur");
  if (ad.laendlich) positive.push("Ländlich");
  if (ad.autobahnNaehe) negative.push("Autobahn");
  if (ad.hauptstrasseNaehe) negative.push("Hauptstraße");
  if (ad.industrieNaehe) negative.push("Industrie");
  if (ad.gleiseNaehe) negative.push("Gleise");
  if (ad.flughafenNaehe) negative.push("Flughafen");

  setHtml("aussicht-details",
    (positive.length > 0 ? `✓ ${positive.join(", ")}` : "") +
    (negative.length > 0 ? `<br>✗ ${negative.join(", ")}` : "")
  );

  // Klappbare Details
  document.querySelectorAll(".score-row").forEach((row) => {
    row.addEventListener("click", () => {
      const detail = row.nextElementSibling;
      if (detail?.classList.contains("score-details")) {
        detail.classList.toggle("hidden");
      }
    });
  });
}

// ============================================================
// Letzte Änderungen
// ============================================================

function renderRecentChanges(listings: TrackedListing[]): void {
  const withChanges = listings
    .filter((l) => l.priceHistory.length >= 2)
    .map((l) => ({ listing: l, change: calculatePriceChange(l.priceHistory)! }))
    .filter((item) => item.change.direction !== "unchanged")
    .sort((a, b) => b.listing.lastSeen - a.listing.lastSeen)
    .slice(0, 10);

  const container = document.getElementById("recent-list")!;

  if (withChanges.length === 0) {
    show("recent-empty");
    return;
  }

  container.innerHTML = withChanges
    .map(({ listing, change }) => `
      <div class="list-item">
        <span class="list-item-title" title="${escapeHtml(listing.title)}">${escapeHtml(listing.title)}</span>
        <span class="list-item-change ${change.direction}">${
          change.direction === "up" ? "↑" : "↓"
        }${Math.abs(Math.round(change.percentChange))}%</span>
      </div>
    `)
    .join("");
}

// ============================================================
// Statistik
// ============================================================

function renderStatistics(stats: PortalStatistics): void {
  const container = document.getElementById("stats")!;
  container.innerHTML = `
    <div class="stat-item">
      <div class="stat-value">${stats.total}</div>
      <div class="stat-label">Gesamt</div>
    </div>
    <div class="stat-item">
      <div class="stat-value">${stats.kleinanzeigen}</div>
      <div class="stat-label">Kleinanzeigen</div>
    </div>
    <div class="stat-item">
      <div class="stat-value">${stats["wg-gesucht"]}</div>
      <div class="stat-label">WG-Gesucht</div>
    </div>
    <div class="stat-item">
      <div class="stat-value">${stats.immowelt + stats.immoscout}</div>
      <div class="stat-label">Andere</div>
    </div>
  `;
}

// ============================================================
// Hilfsfunktionen
// ============================================================

function show(id: string): void {
  document.getElementById(id)?.classList.remove("hidden");
}

function hide(id: string): void {
  document.getElementById(id)?.classList.add("hidden");
}

function setText(id: string, text: string): void {
  const el = document.getElementById(id);
  if (el) el.textContent = text;
}

function setHtml(id: string, html: string): void {
  const el = document.getElementById(id);
  if (el) el.innerHTML = html;
}

function setBar(id: string, value: number): void {
  const el = document.getElementById(id);
  if (!el) return;
  el.style.width = `${value}%`;
  el.style.backgroundColor = getScoreColor(value);
}

function getScoreColor(score: number): string {
  if (score >= 80) return "var(--score-green)";
  if (score >= 60) return "var(--score-yellow)";
  if (score >= 40) return "var(--score-orange)";
  if (score >= 20) return "var(--score-red-orange)";
  return "var(--score-red)";
}

function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
  });
}

function escapeHtml(text: string): string {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}
