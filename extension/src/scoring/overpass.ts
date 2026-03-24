/**
 * OpenStreetMap Overpass API + Nominatim Client.
 *
 * WICHTIG:
 * - Overpass: max 2 Requests/Sekunde, Cache-Pflicht
 * - Nominatim: max 1 Request/Sekunde, User-Agent Pflicht
 * - Requests NUR aus dem Background Service Worker, NICHT aus Content Scripts
 * - Quellennennung: "© OpenStreetMap contributors (ODbL)"
 */

import type { OverpassResult } from "../types";

const OVERPASS_URL = "https://overpass-api.de/api/interpreter";
const NOMINATIM_URL = "https://nominatim.openstreetmap.org/search";
const USER_AGENT = "SchweizerMakler/1.0 (Browser-Extension, kontakt@schweizermakler.de)";

// ============================================================
// Rate Limiting
// ============================================================

class RateLimiter {
  private queue: Array<() => void> = [];
  private lastCall = 0;
  private readonly minInterval: number;

  constructor(maxPerSecond: number) {
    this.minInterval = 1000 / maxPerSecond;
  }

  async acquire(): Promise<void> {
    return new Promise((resolve) => {
      const tryAcquire = () => {
        const now = Date.now();
        const waitTime = Math.max(0, this.lastCall + this.minInterval - now);

        if (waitTime === 0) {
          this.lastCall = now;
          resolve();
        } else {
          setTimeout(() => {
            this.lastCall = Date.now();
            resolve();
          }, waitTime);
        }
      };

      this.queue.push(tryAcquire);
      if (this.queue.length === 1) {
        tryAcquire();
      } else {
        // Warten bis vorherige fertig sind
        const idx = this.queue.length - 1;
        const checkInterval = setInterval(() => {
          if (this.queue.indexOf(tryAcquire) === 0) {
            clearInterval(checkInterval);
            tryAcquire();
          }
        }, this.minInterval);
      }
    });
  }

  release(): void {
    this.queue.shift();
  }
}

const overpassLimiter = new RateLimiter(2);
const nominatimLimiter = new RateLimiter(1);

// ============================================================
// Overpass Queries
// ============================================================

async function queryOverpass(query: string): Promise<OverpassResult> {
  await overpassLimiter.acquire();
  try {
    const response = await fetch(OVERPASS_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: `data=${encodeURIComponent(query)}`,
    });

    if (!response.ok) {
      throw new Error(`Overpass API error: ${response.status}`);
    }

    return await response.json();
  } finally {
    overpassLimiter.release();
  }
}

/** Familienfreundlichkeit: Schulen, Kitas, Parks, Sport, Kultur im Umkreis */
export async function queryFamilyPOIs(
  lat: number,
  lon: number,
  radius = 1500
): Promise<OverpassResult> {
  const query = `
    [out:json][timeout:15];
    (
      node["amenity"="school"](around:${radius},${lat},${lon});
      way["amenity"="school"](around:${radius},${lat},${lon});
      node["amenity"="kindergarten"](around:${radius},${lat},${lon});
      way["amenity"="kindergarten"](around:${radius},${lat},${lon});
      node["leisure"="park"](around:${radius},${lat},${lon});
      way["leisure"="park"](around:${radius},${lat},${lon});
      node["leisure"="playground"](around:${radius},${lat},${lon});
      node["leisure"="sports_centre"](around:${radius},${lat},${lon});
      way["leisure"="sports_centre"](around:${radius},${lat},${lon});
      node["leisure"="pitch"](around:${radius},${lat},${lon});
      way["leisure"="pitch"](around:${radius},${lat},${lon});
      node["leisure"="swimming_pool"](around:${radius},${lat},${lon});
      node["sport"="swimming"](around:${radius},${lat},${lon});
      node["amenity"="library"](around:${radius},${lat},${lon});
      node["amenity"="cinema"](around:${radius},${lat},${lon});
      node["amenity"="theatre"](around:${radius},${lat},${lon});
      node["tourism"="museum"](around:${radius},${lat},${lon});
    );
    out center;
  `;
  return queryOverpass(query);
}

/** ÖPNV: Haltestellen, Bahnhöfe, U-Bahn im Umkreis */
export async function queryOEPNV(lat: number, lon: number): Promise<OverpassResult> {
  const query = `
    [out:json][timeout:15];
    (
      node["highway"="bus_stop"](around:500,${lat},${lon});
      node["public_transport"="stop_position"](around:500,${lat},${lon});
      node["railway"="tram_stop"](around:500,${lat},${lon});
      node["railway"="station"](around:1500,${lat},${lon});
      node["railway"="halt"](around:1500,${lat},${lon});
      node["railway"="subway_entrance"](around:800,${lat},${lon});
      node["railway"="station"]["name"~"Hauptbahnhof|Hbf"](around:5000,${lat},${lon});
    );
    out center;
  `;
  return queryOverpass(query);
}

/** Aussicht & Umgebung: Positive und negative Faktoren */
export async function queryAussicht(lat: number, lon: number): Promise<OverpassResult> {
  const query = `
    [out:json][timeout:15];
    (
      // Positive
      way["natural"="wood"](around:500,${lat},${lon});
      way["landuse"="forest"](around:500,${lat},${lon});
      way["natural"="water"](around:500,${lat},${lon});
      way["waterway"="river"](around:500,${lat},${lon});
      way["leisure"="park"](around:300,${lat},${lon});
      way["leisure"="garden"](around:1000,${lat},${lon});
      way["leisure"="nature_reserve"](around:1000,${lat},${lon});
      way["landuse"="farmland"](around:500,${lat},${lon});
      way["landuse"="meadow"](around:500,${lat},${lon});
      // Negative
      way["highway"="motorway"](around:300,${lat},${lon});
      way["highway"="trunk"](around:300,${lat},${lon});
      way["highway"="primary"](around:150,${lat},${lon});
      way["railway"="rail"](around:200,${lat},${lon});
      way["landuse"="industrial"](around:500,${lat},${lon});
      way["landuse"="commercial"](around:300,${lat},${lon});
      node["aeroway"="aerodrome"](around:3000,${lat},${lon});
      way["aeroway"="aerodrome"](around:3000,${lat},${lon});
    );
    out center;
  `;
  return queryOverpass(query);
}

/** Gebäudedichte im Umkreis zählen */
export async function queryBuildingDensity(
  lat: number,
  lon: number,
  radius = 200
): Promise<number> {
  const query = `
    [out:json][timeout:10];
    way["building"](around:${radius},${lat},${lon});
    out count;
  `;
  const result = await queryOverpass(query);
  // Overpass "out count" gibt ein Element mit tags.total zurück
  const countEl = result.elements[0];
  return countEl?.tags?.total ? parseInt(countEl.tags.total, 10) : 0;
}

// ============================================================
// Nominatim Geocoding
// ============================================================

/** Adresse in Koordinaten umwandeln */
export async function geocodeAddress(
  address: string
): Promise<{ lat: number; lon: number } | null> {
  await nominatimLimiter.acquire();
  try {
    const params = new URLSearchParams({
      q: address,
      format: "json",
      limit: "1",
      countrycodes: "de",
    });

    const response = await fetch(`${NOMINATIM_URL}?${params}`, {
      headers: {
        "User-Agent": USER_AGENT,
        Accept: "application/json",
      },
    });

    if (!response.ok) return null;

    const results = await response.json();
    if (results.length === 0) return null;

    return {
      lat: parseFloat(results[0].lat),
      lon: parseFloat(results[0].lon),
    };
  } catch {
    return null;
  } finally {
    nominatimLimiter.release();
  }
}
