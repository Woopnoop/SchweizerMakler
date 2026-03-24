import type { TrackedListing, GeoCacheEntry, PortalName, PortalStatistics } from "../types";

const GEO_CACHE_PREFIX = "geo_cache:";
const LISTING_SEPARATOR = ":";

/** Listing speichern */
export async function saveListing(listing: TrackedListing): Promise<void> {
  await chrome.storage.local.set({ [listing.id]: listing });
}

/** Listing abrufen */
export async function getListing(id: string): Promise<TrackedListing | undefined> {
  const result = await chrome.storage.local.get(id);
  return result[id] as TrackedListing | undefined;
}

/** Alle Listings abrufen */
export async function getAllListings(): Promise<TrackedListing[]> {
  const all = await chrome.storage.local.get(null);
  return Object.entries(all)
    .filter(([key]) => key.includes(LISTING_SEPARATOR) && !key.startsWith(GEO_CACHE_PREFIX))
    .map(([, value]) => value as TrackedListing);
}

/** Listing löschen */
export async function deleteListing(id: string): Promise<void> {
  await chrome.storage.local.remove(id);
}

/** Listings nach Portal filtern */
export async function getListingsByPortal(portal: PortalName): Promise<TrackedListing[]> {
  const all = await getAllListings();
  return all.filter((l) => l.portal === portal);
}

/** Statistiken pro Portal */
export async function getStatistics(): Promise<PortalStatistics> {
  const all = await getAllListings();
  const stats: PortalStatistics = {
    kleinanzeigen: 0,
    "wg-gesucht": 0,
    immowelt: 0,
    immoscout: 0,
    total: all.length,
  };
  for (const listing of all) {
    stats[listing.portal]++;
  }
  return stats;
}

// ============================================================
// Geo-Cache
// ============================================================

export function getGeoCacheKey(lat: number, lon: number): string {
  return `${GEO_CACHE_PREFIX}${lat.toFixed(3)},${lon.toFixed(3)}`;
}

export async function getGeoCache(lat: number, lon: number): Promise<GeoCacheEntry | undefined> {
  const key = getGeoCacheKey(lat, lon);
  const result = await chrome.storage.local.get(key);
  const entry = result[key] as GeoCacheEntry | undefined;
  if (entry && Date.now() < entry.expiresAt) {
    return entry;
  }
  if (entry) {
    await chrome.storage.local.remove(key);
  }
  return undefined;
}

export async function saveGeoCache(lat: number, lon: number, entry: GeoCacheEntry): Promise<void> {
  const key = getGeoCacheKey(lat, lon);
  await chrome.storage.local.set({ [key]: entry });
}

/** Abgelaufene Cache-Einträge löschen */
export async function clearExpiredCache(): Promise<number> {
  const all = await chrome.storage.local.get(null);
  const now = Date.now();
  const expiredKeys: string[] = [];

  for (const [key, value] of Object.entries(all)) {
    if (key.startsWith(GEO_CACHE_PREFIX)) {
      const entry = value as GeoCacheEntry;
      if (now >= entry.expiresAt) {
        expiredKeys.push(key);
      }
    }
  }

  if (expiredKeys.length > 0) {
    await chrome.storage.local.remove(expiredKeys);
  }
  return expiredKeys.length;
}

// ============================================================
// Cleanup & Export/Import
// ============================================================

/** Alte Einträge löschen (nicht besucht seit maxAgeDays) */
export async function cleanupOldEntries(maxAgeDays: number): Promise<number> {
  const all = await getAllListings();
  const cutoff = Date.now() - maxAgeDays * 24 * 60 * 60 * 1000;
  const oldKeys = all.filter((l) => l.lastSeen < cutoff).map((l) => l.id);

  if (oldKeys.length > 0) {
    await chrome.storage.local.remove(oldKeys);
  }
  return oldKeys.length;
}

/** Alle Listings als JSON exportieren */
export async function exportAll(): Promise<string> {
  const listings = await getAllListings();
  return JSON.stringify(listings, null, 2);
}

/** Listings aus JSON importieren (merge: neuere Daten gewinnen) */
export async function importAll(jsonString: string): Promise<number> {
  const imported: TrackedListing[] = JSON.parse(jsonString);
  let count = 0;

  for (const listing of imported) {
    if (!listing.id || !listing.portal || !listing.priceHistory) continue;

    const existing = await getListing(listing.id);
    if (!existing || listing.lastSeen > existing.lastSeen) {
      await saveListing(listing);
      count++;
    }
  }

  return count;
}

/** Storage-Nutzung abfragen */
export async function getStorageUsage(): Promise<{ bytesUsed: number; bytesAvailable: number }> {
  const bytesUsed = await chrome.storage.local.getBytesInUse(null);
  return {
    bytesUsed,
    bytesAvailable: chrome.storage.local.QUOTA_BYTES - bytesUsed,
  };
}
