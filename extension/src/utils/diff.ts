import type { PriceSnapshot, PriceChange, TrackedListing, BadgeInfo } from "../types";

/** Preisänderung zwischen erstem und letztem Snapshot berechnen */
export function calculatePriceChange(history: PriceSnapshot[]): PriceChange | null {
  if (history.length < 2) return null;

  const first = history[0];
  const last = history[history.length - 1];
  const absoluteEur = last.price - first.price;
  const percentChange = first.price > 0 ? (absoluteEur / first.price) * 100 : 0;
  const daysSinceLastVisit = (Date.now() - last.timestamp) / (1000 * 60 * 60 * 24);

  let direction: PriceChange["direction"];
  if (absoluteEur > 0) direction = "up";
  else if (absoluteEur < 0) direction = "down";
  else direction = "unchanged";

  return {
    absoluteEur,
    percentChange,
    direction,
    daysSinceLastVisit: Math.round(daysSinceLastVisit),
  };
}

/** Soll ein neuer Snapshot hinzugefügt werden? */
export function shouldAddSnapshot(
  existing: PriceSnapshot[],
  newPrice: number,
  now: number
): boolean {
  if (existing.length === 0) return true;

  const last = existing[existing.length - 1];
  const hoursSinceLast = (now - last.timestamp) / (1000 * 60 * 60);

  // Neuer Snapshot wenn Preis geändert ODER 24h+ vergangen
  return last.price !== newPrice || hoursSinceLast >= 24;
}

/** Preisänderung formatieren für Anzeige */
export function formatPriceChange(change: PriceChange): string {
  const sign = change.absoluteEur >= 0 ? "+" : "";
  const abs = Math.abs(change.absoluteEur).toLocaleString("de-DE");
  const pct = Math.abs(change.percentChange).toFixed(1);

  return `${sign}${change.absoluteEur >= 0 ? "" : "-"}${abs} € (${sign}${change.percentChange >= 0 ? "" : "-"}${pct}%)`;
}

/** Badge-Info für ein Listing berechnen */
export function getBadgeInfo(listing: TrackedListing): BadgeInfo {
  const { priceHistory } = listing;

  if (priceHistory.length < 2) {
    return { text: "NEU", color: "#6B7280" };
  }

  const firstPrice = priceHistory[0].price;
  const lastPrice = priceHistory[priceHistory.length - 1].price;
  const percentChange = ((lastPrice - firstPrice) / firstPrice) * 100;

  if (percentChange > 0) {
    return { text: `↑${Math.round(percentChange)}%`, color: "#EF4444" };
  } else if (percentChange < 0) {
    return { text: `↓${Math.abs(Math.round(percentChange))}%`, color: "#22C55E" };
  } else {
    return { text: "=", color: "#6B7280" };
  }
}

/** Preis in deutschem Format anzeigen */
export function formatPrice(price: number): string {
  return price.toLocaleString("de-DE", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}

/** Preis mit €/m² Angabe formatieren: "300.000 € (15 €/m²)" */
export function formatPriceWithSqm(price: number, areaSqm?: number): string {
  const priceStr = formatPrice(price);
  if (areaSqm && areaSqm > 0) {
    const sqmPrice = Math.round(price / areaSqm);
    return `${priceStr} (${sqmPrice} €/m²)`;
  }
  return priceStr;
}
