/**
 * Score-Engine: Orchestriert Overpass-Queries, Berechnung und Caching.
 *
 * OPTIMIERT: Nutzt eine einzige kombinierte Overpass-Query statt 4 separate.
 * Reduziert API-Calls von 4 auf 2 (1 kombinierte + 1 Gebäudedichte).
 */

import type { StandortScore, ListingMessage } from "../types";
import { getCachedScore, setCachedScore } from "./cache";
import { queryAllPOIs, queryBuildingDensity, geocodeAddress } from "./overpass";
import { calculateFamilieScore, calculateOepnvScore, calculateAussichtScore } from "./categories";

/**
 * Standort-Score für gegebene Koordinaten berechnen.
 * 1 kombinierte Overpass-Query + 1 Gebäudedichte-Query (statt 4+1).
 */
export async function calculateStandortScore(
  lat: number,
  lon: number
): Promise<StandortScore> {
  // 1. Cache prüfen
  const cached = await getCachedScore(lat, lon);
  if (cached) return cached;

  // 2. Nur 2 API-Calls statt 4 (kombinierte Query + Gebäudedichte parallel)
  const [allResult, buildingCount] = await Promise.all([
    queryAllPOIs(lat, lon),
    queryBuildingDensity(lat, lon, 200),
  ]);

  // 3. Scores berechnen — die Elemente werden nach Tags aufgeteilt
  const { score: familieScore, details: familieDetails } =
    calculateFamilieScore(allResult.elements);

  const { score: oepnvScore, details: oepnvDetails } =
    calculateOepnvScore(allResult.elements, lat, lon);

  const { score: aussichtScore, details: aussichtDetails } =
    calculateAussichtScore(allResult.elements, buildingCount);

  // 4. Gesamt-Score
  const gesamt = Math.round(
    familieScore * 0.40 +
    oepnvScore * 0.35 +
    aussichtScore * 0.25
  );

  const score: StandortScore = {
    gesamt,
    familie: familieScore,
    oepnv: oepnvScore,
    aussicht: aussichtScore,
    details: {
      familie: familieDetails,
      oepnv: oepnvDetails,
      aussicht: aussichtDetails,
    },
    berechnetAm: Date.now(),
    koordinaten: { lat, lon },
  };

  // 5. Cachen
  await setCachedScore(lat, lon, score);

  return score;
}

/**
 * Koordinaten aus Listing-Daten auflösen.
 */
export async function resolveCoordinates(
  data: ListingMessage["data"]
): Promise<{ lat: number; lon: number } | null> {
  if (data.lat != null && data.lon != null) {
    return { lat: data.lat, lon: data.lon };
  }

  const address = data.address || data.location;
  if (!address) return null;

  return geocodeAddress(address);
}
