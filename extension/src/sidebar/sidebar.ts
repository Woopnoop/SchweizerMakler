/**
 * Sidebar Panel — Erweiterte Ansicht mit Filter, Tabelle, Export.
 */

import type { TrackedListing, PriceChange } from "../types";
import { calculatePriceChange, formatPrice } from "../utils/diff";

let allListings: TrackedListing[] = [];
let sortField = "lastSeen";
let sortAsc = false;

// ============================================================
// Initialisierung
// ============================================================

document.addEventListener("DOMContentLoaded", async () => {
  allListings = (await chrome.runtime.sendMessage({ type: "GET_ALL_LISTINGS" })) as TrackedListing[];
  renderTable();

  // Filter-Events
  document.getElementById("filter-portal")!.addEventListener("change", renderTable);
  document.getElementById("filter-type")!.addEventListener("change", renderTable);
  document.getElementById("filter-change")!.addEventListener("change", renderTable);

  // Sort-Events
  document.querySelectorAll("th[data-sort]").forEach((th) => {
    th.addEventListener("click", () => {
      const field = (th as HTMLElement).dataset.sort!;
      if (sortField === field) {
        sortAsc = !sortAsc;
      } else {
        sortField = field;
        sortAsc = true;
      }
      renderTable();
    });
  });

  // Export/Import
  document.getElementById("btn-export-csv")!.addEventListener("click", exportCSV);
  document.getElementById("btn-export-json")!.addEventListener("click", exportJSON);
  document.getElementById("btn-import-json")!.addEventListener("click", () => {
    document.getElementById("import-file")!.click();
  });
  document.getElementById("import-file")!.addEventListener("change", importJSON);
});

// ============================================================
// Rendering
// ============================================================

function renderTable(): void {
  const filtered = getFilteredListings();
  const sorted = sortListings(filtered);
  const tbody = document.getElementById("listings-body")!;
  const empty = document.getElementById("empty-state")!;

  if (sorted.length === 0) {
    tbody.innerHTML = "";
    empty.classList.remove("hidden");
    return;
  }

  empty.classList.add("hidden");

  tbody.innerHTML = sorted
    .map((listing) => {
      const currentPrice = listing.priceHistory[listing.priceHistory.length - 1].price;
      const change = calculatePriceChange(listing.priceHistory);
      const changeText = change
        ? `${change.direction === "up" ? "↑" : change.direction === "down" ? "↓" : "="} ${Math.abs(Math.round(change.percentChange))}%`
        : "—";
      const changeClass = change
        ? change.direction === "up" ? "change-up" : change.direction === "down" ? "change-down" : ""
        : "";
      const score = listing.standortScore?.gesamt ?? "—";

      return `
        <tr>
          <td title="${escapeHtml(listing.title)}">${escapeHtml(listing.title)}</td>
          <td>${listing.portal}</td>
          <td>${formatPrice(currentPrice)}</td>
          <td class="${changeClass}">${changeText}</td>
          <td>${score}</td>
          <td>${formatDate(listing.lastSeen)}</td>
        </tr>
      `;
    })
    .join("");
}

function getFilteredListings(): TrackedListing[] {
  const portal = (document.getElementById("filter-portal") as HTMLSelectElement).value;
  const type = (document.getElementById("filter-type") as HTMLSelectElement).value;
  const changeFilter = (document.getElementById("filter-change") as HTMLSelectElement).value;

  return allListings.filter((l) => {
    if (portal !== "all" && l.portal !== portal) return false;
    if (type !== "all" && l.listingType !== type) return false;
    if (changeFilter !== "all") {
      const change = calculatePriceChange(l.priceHistory);
      if (!change) return false;
      if (changeFilter === "up" && change.direction !== "up") return false;
      if (changeFilter === "down" && change.direction !== "down") return false;
    }
    return true;
  });
}

function sortListings(listings: TrackedListing[]): TrackedListing[] {
  return [...listings].sort((a, b) => {
    let cmp = 0;
    switch (sortField) {
      case "title":
        cmp = a.title.localeCompare(b.title, "de");
        break;
      case "portal":
        cmp = a.portal.localeCompare(b.portal);
        break;
      case "price":
        cmp = getCurrentPrice(a) - getCurrentPrice(b);
        break;
      case "change":
        cmp = getChangePercent(a) - getChangePercent(b);
        break;
      case "score":
        cmp = (a.standortScore?.gesamt ?? -1) - (b.standortScore?.gesamt ?? -1);
        break;
      case "lastSeen":
        cmp = a.lastSeen - b.lastSeen;
        break;
    }
    return sortAsc ? cmp : -cmp;
  });
}

// ============================================================
// Export / Import
// ============================================================

function exportCSV(): void {
  const headers = ["Titel", "Portal", "Ort", "Typ", "Aktueller Preis", "Erster Preis", "Änderung %", "Score", "Erster Besuch", "Letzter Besuch", "URL"];
  const rows = allListings.map((l) => {
    const change = calculatePriceChange(l.priceHistory);
    return [
      `"${l.title.replace(/"/g, '""')}"`,
      l.portal,
      `"${l.location.replace(/"/g, '""')}"`,
      l.listingType,
      getCurrentPrice(l),
      l.priceHistory[0].price,
      change ? change.percentChange.toFixed(1) : "",
      l.standortScore?.gesamt ?? "",
      formatDate(l.firstSeen),
      formatDate(l.lastSeen),
      l.url,
    ].join(";");
  });

  const csv = [headers.join(";"), ...rows].join("\n");
  downloadFile(csv, "schweizermakler-export.csv", "text/csv;charset=utf-8");
}

async function exportJSON(): Promise<void> {
  const json = (await chrome.runtime.sendMessage({ type: "EXPORT_DATA" })) as string;
  downloadFile(json, "schweizermakler-export.json", "application/json");
}

async function importJSON(event: Event): Promise<void> {
  const file = (event.target as HTMLInputElement).files?.[0];
  if (!file) return;

  const text = await file.text();
  const count = (await chrome.runtime.sendMessage({ type: "IMPORT_DATA", jsonData: text })) as number;
  alert(`${count} Einträge importiert.`);

  // Daten neu laden
  allListings = (await chrome.runtime.sendMessage({ type: "GET_ALL_LISTINGS" })) as TrackedListing[];
  renderTable();
}

// ============================================================
// Hilfsfunktionen
// ============================================================

function getCurrentPrice(l: TrackedListing): number {
  return l.priceHistory[l.priceHistory.length - 1].price;
}

function getChangePercent(l: TrackedListing): number {
  const change = calculatePriceChange(l.priceHistory);
  return change?.percentChange ?? 0;
}

function downloadFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString("de-DE");
}

function escapeHtml(text: string): string {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}
