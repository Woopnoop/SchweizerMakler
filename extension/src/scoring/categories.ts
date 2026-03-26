/**
 * Score-Berechnungen pro Kategorie.
 * Reine Funktionen ohne I/O — arbeiten nur mit OverpassResult-Daten.
 */

import type { OverpassElement, FamilieDetails, OepnvDetails, AussichtDetails } from "../types";

// ============================================================
// Hilfsfunktionen
// ============================================================

/** Anzahl Elemente mit bestimmtem Tag zählen */
function countByTag(elements: OverpassElement[], key: string, value: string): number {
  return elements.filter((e) => e.tags?.[key] === value).length;
}

/** Prüfen ob mindestens ein Element mit Tag vorhanden */
function hasTag(elements: OverpassElement[], key: string, value: string): boolean {
  return elements.some((e) => e.tags?.[key] === value);
}

/** Haversine-Distanz in Metern */
export function calculateDistance(
  lat1: number, lon1: number,
  lat2: number, lon2: number
): number {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/** Koordinate eines Elements (direkt oder center) */
function getCoords(el: OverpassElement): { lat: number; lon: number } | null {
  if (el.lat != null && el.lon != null) return { lat: el.lat, lon: el.lon };
  if (el.center) return el.center;
  return null;
}

/** Elemente innerhalb eines Radius um einen Punkt filtern */
function elementsInRadius(
  elements: OverpassElement[],
  lat: number, lon: number,
  radiusM: number
): OverpassElement[] {
  return elements.filter((el) => {
    const c = getCoords(el);
    if (!c) return false;
    return calculateDistance(lat, lon, c.lat, c.lon) <= radiusM;
  });
}

// ============================================================
// Familienfreundlichkeit (0-100, Gewichtung: 40%)
// ============================================================

export function calculateFamilieScore(
  elements: OverpassElement[]
): { score: number; details: FamilieDetails } {
  const schulen = Math.min(countByTag(elements, "amenity", "school"), 3);
  const kindergaerten = Math.min(countByTag(elements, "amenity", "kindergarten"), 3);
  const parks = Math.min(countByTag(elements, "leisure", "park"), 4);
  const spielplaetze = Math.min(countByTag(elements, "leisure", "playground"), 3);
  const sportplaetze = Math.min(
    countByTag(elements, "leisure", "sports_centre") +
    countByTag(elements, "leisure", "pitch"),
    4
  );
  const schwimmbaeder = Math.min(
    countByTag(elements, "leisure", "swimming_pool") +
    countByTag(elements, "sport", "swimming"),
    2
  );
  const bibliotheken = Math.min(countByTag(elements, "amenity", "library"), 2);
  const kultur = Math.min(
    countByTag(elements, "amenity", "cinema") +
    countByTag(elements, "amenity", "theatre") +
    countByTag(elements, "tourism", "museum"),
    3
  );

  const rawPoints =
    schulen * 10 +
    kindergaerten * 8 +
    parks * 5 +
    spielplaetze * 5 +
    sportplaetze * 4 +
    schwimmbaeder * 6 +
    bibliotheken * 5 +
    kultur * 4;

  // Maximale Rohpunkte: 30 + 24 + 20 + 15 + 16 + 12 + 10 + 12 = 139
  // Aber mit unseren Caps: 30 + 24 + 20 + 15 + 16 + 12 + 10 + 12 = 139
  const maxPoints = 139;
  const score = Math.round((rawPoints / maxPoints) * 100);

  return {
    score: Math.min(score, 100),
    details: { schulen, kindergaerten, parks, spielplaetze, sportplaetze, schwimmbaeder, bibliotheken, kultur },
  };
}

// ============================================================
// ÖPNV-Anbindung (0-100, Gewichtung: 35%)
// ============================================================

export function calculateOepnvScore(
  elements: OverpassElement[],
  centerLat: number,
  centerLon: number
): { score: number; details: OepnvDetails } {
  const busHaltestellen = Math.min(
    countByTag(elements, "highway", "bus_stop") +
    countByTag(elements, "public_transport", "stop_position"),
    5
  );
  const tramHaltestellen = Math.min(countByTag(elements, "railway", "tram_stop"), 3);
  const bahnhoefe = Math.min(
    countByTag(elements, "railway", "station") +
    countByTag(elements, "railway", "halt"),
    2
  );
  const ubahn = Math.min(countByTag(elements, "railway", "subway_entrance"), 2);

  // Haltestellen-Dichte im 300m Radius
  const stopsIn300m = elementsInRadius(
    elements.filter(
      (e) =>
        e.tags?.highway === "bus_stop" ||
        e.tags?.public_transport === "stop_position" ||
        e.tags?.railway === "tram_stop"
    ),
    centerLat, centerLon, 300
  ).length;

  // Distanz zum Hauptbahnhof
  const hbfElements = elements.filter(
    (e) => e.tags?.railway === "station" && /Hauptbahnhof|Hbf/i.test(e.tags?.name ?? "")
  );
  let distanzHbfKm: number | null = null;
  if (hbfElements.length > 0) {
    const coords = getCoords(hbfElements[0]);
    if (coords) {
      distanzHbfKm = calculateDistance(centerLat, centerLon, coords.lat, coords.lon) / 1000;
    }
  }

  // Linienanzahl (route relations, falls vorhanden)
  const linienAnzahl = elements.filter(
    (e) => e.tags?.route === "bus" || e.tags?.route === "tram"
  ).length;

  // Punkte berechnen
  let rawPoints = 0;
  rawPoints += busHaltestellen * 5;       // max 25
  rawPoints += tramHaltestellen * 8;      // max 24
  rawPoints += bahnhoefe * 15;            // max 30
  rawPoints += ubahn * 12;                // max 24

  // Dichte-Bonus
  if (stopsIn300m > 5) rawPoints += 15;
  else if (stopsIn300m > 3) rawPoints += 10;

  // HBF-Bonus
  if (distanzHbfKm !== null) {
    if (distanzHbfKm < 2) rawPoints += 15;
    else if (distanzHbfKm < 5) rawPoints += 10;
    else if (distanzHbfKm < 10) rawPoints += 5;
  }

  const maxPoints = 25 + 24 + 30 + 24 + 15 + 15; // 133
  const score = Math.round((rawPoints / maxPoints) * 100);

  return {
    score: Math.min(score, 100),
    details: {
      busHaltestellen,
      tramHaltestellen,
      bahnhoefe,
      ubahn,
      haltestellenDichte300m: stopsIn300m,
      distanzHbfKm: distanzHbfKm !== null ? Math.round(distanzHbfKm * 10) / 10 : null,
      linienAnzahl,
    },
  };
}

// ============================================================
// Aussicht & Umgebungsqualität (0-100, Gewichtung: 25%)
// ============================================================

export function calculateAussichtScore(
  elements: OverpassElement[],
  buildingCount: number
): { score: number; details: AussichtDetails } {
  // Positive Faktoren
  const waldNaehe = hasTag(elements, "natural", "wood") || hasTag(elements, "landuse", "forest");
  const gewaesserNaehe = hasTag(elements, "natural", "water") || hasTag(elements, "waterway", "river");
  const grosserPark = hasTag(elements, "leisure", "park"); // vereinfacht — Fläche schwer zu bestimmen aus Overpass center
  const naturschutz = hasTag(elements, "leisure", "nature_reserve") || hasTag(elements, "leisure", "garden");
  const laendlich = hasTag(elements, "landuse", "farmland") || hasTag(elements, "landuse", "meadow");
  const gebaeudeGering = buildingCount < 20;

  // Negative Faktoren
  const autobahnNaehe = hasTag(elements, "highway", "motorway") || hasTag(elements, "highway", "trunk");
  const hauptstrasseNaehe = hasTag(elements, "highway", "primary");
  const gleiseNaehe =
    elements.some((e) => e.tags?.railway === "rail") &&
    !elements.every((e) => e.tags?.railway === "station");
  const industrieNaehe = hasTag(elements, "landuse", "industrial");
  const gewerbeNaehe = hasTag(elements, "landuse", "commercial");
  const hochhausCluster = false; // Schwer per Overpass zu bestimmen, auf false setzen
  const flughafenNaehe = hasTag(elements, "aeroway", "aerodrome");

  // Punkte
  let rawPoints = 0;
  if (waldNaehe) rawPoints += 15;
  if (gewaesserNaehe) rawPoints += 12;
  if (grosserPark) rawPoints += 10;
  if (naturschutz) rawPoints += 8;
  if (laendlich) rawPoints += 8;
  if (gebaeudeGering) rawPoints += 10;

  if (autobahnNaehe) rawPoints -= 20;
  if (hauptstrasseNaehe) rawPoints -= 10;
  if (gleiseNaehe) rawPoints -= 8;
  if (industrieNaehe) rawPoints -= 15;
  if (gewerbeNaehe) rawPoints -= 8;
  if (hochhausCluster) rawPoints -= 10;
  if (flughafenNaehe) rawPoints -= 12;

  // Normalisierung: (50 + Rohpunkte) clamped auf 0-100
  const score = Math.max(0, Math.min(100, 50 + rawPoints));

  return {
    score,
    details: {
      waldNaehe, gewaesserNaehe, grosserPark, naturschutz, laendlich, gebaeudeGering,
      autobahnNaehe, hauptstrasseNaehe, gleiseNaehe, industrieNaehe, gewerbeNaehe,
      hochhausCluster, flughafenNaehe,
    },
  };
}
