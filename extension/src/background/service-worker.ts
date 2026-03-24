/**
 * Background Service Worker — Zentraler Hub der Extension.
 *
 * Empfängt Daten von Content Scripts, verwaltet Storage,
 * berechnet Standort-Scores und aktualisiert Badges.
 */

import type {
  ListingMessage,
  TrackedListing,
  PriceSnapshot,
  PopupMessage,
  PortalStatistics,
  ListingStatus,
} from "../types";
import {
  saveListing,
  getListing,
  getAllListings,
  deleteListing,
  getStatistics,
  cleanupOldEntries,
  exportAll,
  importAll,
} from "../utils/storage";
import { clearExpiredCache } from "../utils/storage";
import { shouldAddSnapshot, calculatePriceChange, getBadgeInfo } from "../utils/diff";
import { calculateStandortScore, resolveCoordinates } from "../scoring/score-engine";

// ============================================================
// Message Handler
// ============================================================

chrome.runtime.onMessage.addListener(
  (message: ListingMessage | PopupMessage, sender, sendResponse) => {
    if (message.type === "LISTING_DETECTED") {
      handleListingDetected(message.data, sender.tab?.id);
      // Kein sendResponse nötig — fire-and-forget
      return false;
    }

    // Popup/Sidebar Messages brauchen async Antwort
    handlePopupMessage(message as PopupMessage).then(sendResponse);
    return true; // Hält den Message-Channel offen für async
  }
);

// ============================================================
// Listing Detection
// ============================================================

async function handleListingDetected(
  data: ListingMessage["data"],
  tabId?: number
): Promise<void> {
  const key = `${data.portal}:${data.externalId}`;
  const now = Date.now();

  const newSnapshot: PriceSnapshot = {
    timestamp: now,
    price: data.price,
  };

  const existing = await getListing(key);

  if (existing) {
    // Nur neuen Snapshot wenn nötig
    if (shouldAddSnapshot(existing.priceHistory, data.price, now)) {
      existing.priceHistory.push(newSnapshot);
    }

    existing.lastSeen = now;
    existing.title = data.title;
    existing.url = data.url;

    await saveListing(existing);
    updateBadge(existing, tabId);

    // Score asynchron berechnen falls noch nicht vorhanden
    if (!existing.standortScore) {
      triggerScoreCalculation(key, data);
    }
  } else {
    // Neuer Eintrag
    const newListing: TrackedListing = {
      id: key,
      portal: data.portal,
      url: data.url,
      title: data.title.substring(0, 100),
      location: data.location,
      areaSqm: data.areaSqm,
      rooms: data.rooms,
      listingType: data.listingType,
      priceHistory: [newSnapshot],
      firstSeen: now,
      lastSeen: now,
    };

    await saveListing(newListing);
    updateBadge(newListing, tabId);

    // Score asynchron berechnen
    triggerScoreCalculation(key, data);
  }
}

// ============================================================
// Badge
// ============================================================

function updateBadge(listing: TrackedListing, tabId?: number): void {
  if (!tabId) return;

  const badge = getBadgeInfo(listing);
  chrome.action.setBadgeText({ text: badge.text, tabId });
  chrome.action.setBadgeBackgroundColor({ color: badge.color, tabId });
}

// ============================================================
// Score-Berechnung (async, non-blocking)
// ============================================================

async function triggerScoreCalculation(
  listingId: string,
  data: ListingMessage["data"]
): Promise<void> {
  try {
    const coords = await resolveCoordinates(data);
    if (!coords) return;

    const score = await calculateStandortScore(coords.lat, coords.lon);

    // Listing aktualisieren
    const listing = await getListing(listingId);
    if (listing) {
      listing.coordinates = coords;
      listing.standortScore = score;
      await saveListing(listing);
    }
  } catch {
    // Score-Berechnung ist optional — Fehler nicht propagieren
  }
}

// ============================================================
// Popup/Sidebar Message Handler
// ============================================================

async function handlePopupMessage(
  message: PopupMessage
): Promise<ListingStatus | TrackedListing[] | PortalStatistics | string | number | null> {
  switch (message.type) {
    case "GET_CURRENT_LISTING": {
      const all = await getAllListings();
      const listing = all.find((l) => l.url === message.url);
      if (!listing) return { tracked: false } as ListingStatus;

      const priceChange = calculatePriceChange(listing.priceHistory) ?? undefined;
      return { tracked: true, listing, priceChange } as ListingStatus;
    }

    case "GET_ALL_LISTINGS":
      return getAllListings();

    case "GET_STATISTICS":
      return getStatistics();

    case "DELETE_LISTING":
      await deleteListing(message.id);
      return null;

    case "EXPORT_DATA":
      return exportAll();

    case "IMPORT_DATA":
      return importAll(message.jsonData);

    default:
      return null;
  }
}

// ============================================================
// Periodischer Cleanup (chrome.alarms)
// ============================================================

chrome.alarms.create("weekly-cleanup", {
  periodInMinutes: 7 * 24 * 60, // Wöchentlich
});

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === "weekly-cleanup") {
    await cleanupOldEntries(365); // Einträge > 1 Jahr löschen
    await clearExpiredCache();    // Abgelaufene Geo-Cache Einträge löschen
  }
});
