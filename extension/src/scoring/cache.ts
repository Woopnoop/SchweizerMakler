import type { StandortScore, GeoCacheEntry } from "../types";
import { getGeoCache, saveGeoCache } from "../utils/storage";

/** Cache-Dauer: 30 Tage */
const CACHE_TTL_MS = 30 * 24 * 60 * 60 * 1000;

/** Score aus dem Geo-Cache laden (null = nicht vorhanden oder abgelaufen) */
export async function getCachedScore(
  lat: number,
  lon: number
): Promise<StandortScore | null> {
  const entry = await getGeoCache(lat, lon);
  return entry?.score ?? null;
}

/** Score im Geo-Cache speichern */
export async function setCachedScore(
  lat: number,
  lon: number,
  score: StandortScore
): Promise<void> {
  const now = Date.now();
  const entry: GeoCacheEntry = {
    score,
    cachedAt: now,
    expiresAt: now + CACHE_TTL_MS,
  };
  await saveGeoCache(lat, lon, entry);
}
