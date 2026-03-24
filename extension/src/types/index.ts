// ============================================================
// SchweizerMakler Extension — Shared Type Definitions
// ============================================================

/** Unterstützte Immobilienportale */
export type PortalName = "kleinanzeigen" | "wg-gesucht" | "immowelt" | "immoscout";

/** Ein einzelner Preisdatenpunkt */
export interface PriceSnapshot {
  timestamp: number;
  price: number;
  priceCategory?: string;
}

/** Eine getrackte Immobilien-Anzeige */
export interface TrackedListing {
  /** Eindeutige ID: "{portal}:{external_id}" */
  id: string;
  portal: PortalName;
  url: string;
  /** Titel der Anzeige (max 100 Zeichen) */
  title: string;
  /** Stadt / Stadtteil */
  location: string;
  areaSqm?: number;
  rooms?: number;
  listingType: "miete" | "kauf";
  /** Preis-Historie — chronologisch sortiert */
  priceHistory: PriceSnapshot[];
  firstSeen: number;
  lastSeen: number;
  coordinates?: { lat: number; lon: number };
  standortScore?: StandortScore;
}

/** Nachricht vom Content Script an den Background Service Worker */
export interface ListingMessage {
  type: "LISTING_DETECTED";
  data: {
    portal: PortalName;
    externalId: string;
    url: string;
    title: string;
    location: string;
    price: number;
    areaSqm?: number;
    rooms?: number;
    listingType: "miete" | "kauf";
    address?: string;
    lat?: number;
    lon?: number;
  };
}

/** Preisänderungs-Info */
export interface PriceChange {
  absoluteEur: number;
  percentChange: number;
  direction: "up" | "down" | "unchanged";
  daysSinceLastVisit: number;
}

/** Antwort vom Background Worker an Popup/Sidebar */
export interface ListingStatus {
  tracked: boolean;
  listing?: TrackedListing;
  priceChange?: PriceChange;
}

// ============================================================
// Standort-Score
// ============================================================

export interface FamilieDetails {
  schulen: number;
  kindergaerten: number;
  parks: number;
  spielplaetze: number;
  sportplaetze: number;
  schwimmbaeder: number;
  bibliotheken: number;
  /** Kino + Theater + Museum */
  kultur: number;
}

export interface OepnvDetails {
  busHaltestellen: number;
  tramHaltestellen: number;
  bahnhoefe: number;
  ubahn: number;
  haltestellenDichte300m: number;
  distanzHbfKm: number | null;
  linienAnzahl: number;
}

export interface AussichtDetails {
  // Positive Faktoren
  waldNaehe: boolean;
  gewaesserNaehe: boolean;
  grosserPark: boolean;
  naturschutz: boolean;
  laendlich: boolean;
  gebaeudeGering: boolean;
  // Negative Faktoren
  autobahnNaehe: boolean;
  hauptstrasseNaehe: boolean;
  gleiseNaehe: boolean;
  industrieNaehe: boolean;
  gewerbeNaehe: boolean;
  hochhausCluster: boolean;
  flughafenNaehe: boolean;
}

export interface StandortScore {
  /** Gesamt-Score 0-100 */
  gesamt: number;
  /** Familienfreundlichkeit 0-100 (Gewichtung: 40%) */
  familie: number;
  /** ÖPNV-Anbindung 0-100 (Gewichtung: 35%) */
  oepnv: number;
  /** Aussicht & Umgebung 0-100 (Gewichtung: 25%) */
  aussicht: number;
  details: {
    familie: FamilieDetails;
    oepnv: OepnvDetails;
    aussicht: AussichtDetails;
  };
  berechnetAm: number;
  koordinaten: { lat: number; lon: number };
}

// ============================================================
// Overpass API
// ============================================================

export interface OverpassElement {
  type: string;
  id: number;
  lat?: number;
  lon?: number;
  tags?: Record<string, string>;
  center?: { lat: number; lon: number };
}

export interface OverpassResult {
  elements: OverpassElement[];
}

// ============================================================
// Geo-Cache
// ============================================================

export interface GeoCacheEntry {
  score: StandortScore;
  cachedAt: number;
  expiresAt: number;
}

// ============================================================
// Popup ↔ Background Messaging
// ============================================================

export type PopupMessage =
  | { type: "GET_CURRENT_LISTING"; url: string }
  | { type: "GET_ALL_LISTINGS" }
  | { type: "GET_STATISTICS" }
  | { type: "DELETE_LISTING"; id: string }
  | { type: "EXPORT_DATA" }
  | { type: "IMPORT_DATA"; jsonData: string };

export interface PortalStatistics {
  kleinanzeigen: number;
  "wg-gesucht": number;
  immowelt: number;
  immoscout: number;
  total: number;
}

/** Badge-Darstellung */
export interface BadgeInfo {
  text: string;
  color: string;
}
