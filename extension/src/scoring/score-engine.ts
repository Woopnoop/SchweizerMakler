/**
 * Score-Engine: Orchestriert Overpass-Queries, Berechnung und Caching.
 * Wird nur aus dem Background Service Worker aufgerufen.
 */

import type { StandortScore, ListingMessage } from "../types";
import { getCachedScore, setCachedScore } from "./cache";
import { queryFamilyPOIs, queryOEPNV, queryAussicht, queryBuildingDensity, geocodeAddress } from "./overpass";
import { calculateFamilieScore, calculateOepnvScore, calculateAussichtScore } from "./categories";

/**
 * Standort-Score für gegebene Koordinaten berechnen.
 * Prüft zuerst den Cache, dann Overpass-Queries parallel.
 */
export async function calculateStandortScore(
  lat: number,
  lon: number
): Promise<StandortScore> {
  // 1. Cache prüfen
  const cached = await getCachedScore(lat, lon);
  if (cached) return cached;

  // 2. Overpass-Queries parallel ausführen
  const [familyResult, oepnvResult, aussichtResult, buildingCount] = await Promise.all([
    queryFamilyPOIs(lat, lon),
    queryOEPNV(lat, lon),
    queryAussicht(lat, lon),
    queryBuildingDensity(lat, lon, 200),
  ]);

  // 3. Scores berechnen
  const { score: familieScore, details: familieDetails } =
    calculateFamilieScore(familyResult.elements);

  const { score: oepnvScore, details: oepnvDetails } =
    calculateOepnvScore(oepnvResult.elements, lat, lon);

  const { score: aussichtScore, details: aussichtDetails } =
    calculateAussichtScore(aussichtResult.elements, buildingCount);

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
 * Nutzt direkte Koordinaten oder Geocoding via Nominatim.
 */
export async function resolveCoordinates(
  data: ListingMessage["data"]
): Promise<{ lat: number; lon: number } | null> {
  // Direkte Koordinaten vom Portal
  if (data.lat != null && data.lon != null) {
    return { lat: data.lat, lon: data.lon };
  }

  // Geocoding über Adresse oder Ort
  const address = data.address || data.location;
  if (!address) return null;

  return geocodeAddress(address);
}
