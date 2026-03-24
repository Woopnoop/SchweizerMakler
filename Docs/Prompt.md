# SchweizerMakler — Implementierungs-Prompt

## Kontext

Dieses Dokument beschreibt die vollständige Implementierung des SchweizerMakler-Projekts.
Vor der Entwicklung MUSS die Rechtsanalyse in `D:\Projekte\AnwaltKlausi\Docs\Immofinder_Rechtliche_Analyse_2026-03-23.md` gelesen werden. Alle dort dokumentierten Einschränkungen gelten verbindlich.

---

## Teil 1: Browser-Extension — Preis-Tracker

### 1.1 Grundprinzip

Das Plugin liest beim **manuellen Seitenbesuch** eines Maklers den aktuellen Preis einer Immobilienanzeige aus der bereits geladenen Webseite und speichert ihn **lokal im Browser**. Bei einem späteren Besuch derselben Anzeige wird der Preisunterschied berechnet und angezeigt.

### 1.2 Erkennungsschutz — KRITISCH

Die Extension darf von der Zielwebseite **nicht erkannt** werden können. Folgende Regeln sind zwingend:

**ERLAUBT:**
- Content Script liest existierende DOM-Elemente (Preis, Titel, Adresse) per `document.querySelector()`
- Daten werden via `chrome.runtime.sendMessage()` an den Background Service Worker gesendet
- Anzeige erfolgt ausschließlich über Popup, Sidebar oder Badge

**VERBOTEN:**
- DOM-Manipulation jeglicher Art (kein `document.createElement()`, kein `innerHTML`, kein `classList.add()`)
- Neue Event Listener auf der Seite registrieren die von der Seite erkannt werden könnten
- `window`-Objekt der Seite modifizieren oder Variablen injizieren
- CSS in die Seite einfügen (kein `<style>` Tag, kein `insertRule()`)
- Zusätzliche Netzwerk-Requests an die Zielseite oder deren API
- `fetch()` oder `XMLHttpRequest` an Portal-Domains aus dem Content Script
- WebSocket-Verbindungen zur Zielseite

**TECHNISCH:**
- Content Script läuft in einer isolierten Welt (`world: "ISOLATED"` in Manifest V3)
- Content Script hat keinen Zugriff auf `window`-Variablen der Seite und die Seite keinen auf das Script
- Alle DOM-Reads in `requestIdleCallback()` oder `setTimeout()` wrappen um Timing-Fingerprinting zu vermeiden
- Keine deterministischen Timing-Patterns die als Bot-Verhalten erkannt werden könnten

### 1.3 Manifest V3

```json
{
  "manifest_version": 3,
  "name": "SchweizerMakler Preis-Tracker",
  "version": "1.0.0",
  "description": "Preisänderungen bei Immobilienportalen im Blick behalten",
  "permissions": [
    "storage",
    "sidePanel"
  ],
  "host_permissions": [
    "https://overpass-api.de/*",
    "https://nominatim.openstreetmap.org/*"
  ],
  "action": {
    "default_popup": "popup/popup.html",
    "default_icon": {
      "16": "icons/icon16.png",
      "48": "icons/icon48.png",
      "128": "icons/icon128.png"
    }
  },
  "side_panel": {
    "default_path": "sidebar/sidebar.html"
  },
  "background": {
    "service_worker": "background/service-worker.js",
    "type": "module"
  },
  "content_scripts": [
    {
      "matches": ["*://*.kleinanzeigen.de/*"],
      "js": ["content/kleinanzeigen.js"],
      "run_at": "document_idle",
      "world": "ISOLATED"
    },
    {
      "matches": ["*://*.wg-gesucht.de/*"],
      "js": ["content/wg-gesucht.js"],
      "run_at": "document_idle",
      "world": "ISOLATED"
    },
    {
      "matches": ["*://*.immowelt.de/*"],
      "js": ["content/immowelt.js"],
      "run_at": "document_idle",
      "world": "ISOLATED"
    },
    {
      "matches": ["*://*.immobilienscout24.de/*"],
      "js": ["content/immoscout.js"],
      "run_at": "document_idle",
      "world": "ISOLATED"
    }
  ],
  "icons": {
    "16": "icons/icon16.png",
    "48": "icons/icon48.png",
    "128": "icons/icon128.png"
  }
}
```

### 1.4 Datenmodell

```typescript
// types/index.ts

/** Ein einzelner Preisdatenpunkt */
interface PriceSnapshot {
  /** Zeitpunkt des Seitenbesuchs */
  timestamp: number;
  /** Preis in EUR */
  price: number;
  /** Preiskategorie (z.B. "250-300k") als Fallback falls Rohpreis nicht gespeichert werden soll */
  priceCategory?: string;
}

/** Ein getrackte Immobilien-Anzeige */
interface TrackedListing {
  /** Eindeutige ID: "{portal}:{external_id}" */
  id: string;
  /** Portal-Name */
  portal: "kleinanzeigen" | "wg-gesucht" | "immowelt" | "immoscout";
  /** URL der Anzeige */
  url: string;
  /** Titel der Anzeige (gekürzt, max 100 Zeichen) */
  title: string;
  /** Stadt / Stadtteil */
  location: string;
  /** Wohnfläche in m² (falls verfügbar) */
  areaSqm?: number;
  /** Zimmeranzahl (falls verfügbar) */
  rooms?: number;
  /** Art: Miete oder Kauf */
  listingType: "miete" | "kauf";
  /** Preis-Historie — chronologisch sortiert */
  priceHistory: PriceSnapshot[];
  /** Erster Besuch */
  firstSeen: number;
  /** Letzter Besuch */
  lastSeen: number;
}

/** Nachricht vom Content Script an den Background Service Worker */
interface ListingMessage {
  type: "LISTING_DETECTED";
  data: {
    portal: TrackedListing["portal"];
    externalId: string;
    url: string;
    title: string;
    location: string;
    price: number;
    areaSqm?: number;
    rooms?: number;
    listingType: "miete" | "kauf";
  };
}

/** Antwort vom Background Worker an Popup/Sidebar */
interface ListingStatus {
  tracked: boolean;
  listing?: TrackedListing;
  priceChange?: {
    absoluteEur: number;
    percentChange: number;
    direction: "up" | "down" | "unchanged";
    daysSinceLastVisit: number;
  };
}
```

### 1.5 Content Scripts — Portal-Parser

Jedes Content Script hat eine einzige Aufgabe: Daten aus dem DOM lesen und an den Background Worker senden. KEIN DOM wird verändert.

**Grundstruktur für alle Content Scripts:**

```typescript
// content/base-parser.ts

function waitForIdle(callback: () => void): void {
  if ("requestIdleCallback" in window) {
    requestIdleCallback(callback, { timeout: 3000 });
  } else {
    setTimeout(callback, 500 + Math.random() * 1000); // Randomisiertes Timing
  }
}

function extractAndSend(data: ListingMessage["data"]): void {
  chrome.runtime.sendMessage({
    type: "LISTING_DETECTED",
    data,
  } satisfies ListingMessage);
}
```

**Kleinanzeigen.de Parser — IMPLEMENTIERE:**
- Erkennung: URL enthält `/s-anzeige/` (Detailseite)
- Preis: Selektor für den Preis-Container (z.B. `#viewad-price`)
- Titel: `<h1>` oder spezifischer Selektor
- Ort: Adress-/Standort-Element
- Fläche/Zimmer: Aus den Attribut-Feldern parsen
- Listing-Typ: Aus der Kategorie-URL oder Breadcrumb ableiten (miete/kauf)

**WG-Gesucht Parser — IMPLEMENTIERE:**
- Erkennung: URL enthält Anzeigen-Muster (numerische ID)
- Preis: Mietpreis-Element
- Titel: Anzeigentitel
- Ort: Stadtteil/Adresse
- Fläche/Zimmer: Aus der Detailtabelle

**Immowelt Parser — IMPLEMENTIERE:**
- Erkennung: URL enthält `/expose/`
- Preis, Titel, Ort, Fläche, Zimmer aus den Exposé-Elementen
- Hinweis: Immowelt lädt vieles per JavaScript nach → `MutationObserver` auf den Preis-Container nutzen, aber NUR zum Lesen, NICHT zum Schreiben

**ImmobilienScout24 Parser — IMPLEMENTIERE:**
- Erkennung: URL enthält `/expose/`
- Preis: Aus dem Exposé-Header
- Achtung: IS24 nutzt dynamisches Rendering → DOM kann sich ändern
- WICHTIG: Dieses Portal hat das höchste Risiko. Der Parser muss besonders minimal sein. Content Script darf im IS24-Kontext KEINERLEI auffällige Aktionen ausführen.

### 1.6 Background Service Worker

```typescript
// background/service-worker.ts

/**
 * Empfängt Listing-Daten von Content Scripts.
 * Speichert/aktualisiert in chrome.storage.local.
 * Aktualisiert den Badge auf dem Extension-Icon.
 */

chrome.runtime.onMessage.addListener((message: ListingMessage, sender, sendResponse) => {
  if (message.type === "LISTING_DETECTED") {
    handleListingDetected(message.data);
  }
});

async function handleListingDetected(data: ListingMessage["data"]): Promise<void> {
  const key = `${data.portal}:${data.externalId}`;

  // Bestehenden Eintrag laden
  const stored = await chrome.storage.local.get(key);
  const existing: TrackedListing | undefined = stored[key];

  const now = Date.now();
  const newSnapshot: PriceSnapshot = {
    timestamp: now,
    price: data.price,
  };

  if (existing) {
    const lastPrice = existing.priceHistory[existing.priceHistory.length - 1];

    // Nur neuen Snapshot hinzufügen wenn sich der Preis geändert hat
    // ODER mindestens 24h seit dem letzten Snapshot vergangen sind
    const hoursSinceLast = (now - lastPrice.timestamp) / (1000 * 60 * 60);
    if (lastPrice.price !== data.price || hoursSinceLast >= 24) {
      existing.priceHistory.push(newSnapshot);
    }

    existing.lastSeen = now;
    existing.title = data.title;
    existing.url = data.url;

    await chrome.storage.local.set({ [key]: existing });

    // Badge aktualisieren
    updateBadge(existing, sender.tab?.id);
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

    await chrome.storage.local.set({ [key]: newListing });
    updateBadge(newListing, sender.tab?.id);
  }
}

function updateBadge(listing: TrackedListing, tabId?: number): void {
  if (!tabId) return;

  const history = listing.priceHistory;
  if (history.length < 2) {
    // Erster Besuch — "NEU" Badge
    chrome.action.setBadgeText({ text: "NEU", tabId });
    chrome.action.setBadgeBackgroundColor({ color: "#6B7280", tabId });
    return;
  }

  const firstPrice = history[0].price;
  const lastPrice = history[history.length - 1].price;
  const percentChange = ((lastPrice - firstPrice) / firstPrice) * 100;

  if (percentChange > 0) {
    chrome.action.setBadgeText({ text: `↑${Math.round(percentChange)}%`, tabId });
    chrome.action.setBadgeBackgroundColor({ color: "#EF4444", tabId }); // Rot = teurer
  } else if (percentChange < 0) {
    chrome.action.setBadgeText({ text: `↓${Math.abs(Math.round(percentChange))}%`, tabId });
    chrome.action.setBadgeBackgroundColor({ color: "#22C55E", tabId }); // Grün = günstiger
  } else {
    chrome.action.setBadgeText({ text: "=", tabId });
    chrome.action.setBadgeBackgroundColor({ color: "#6B7280", tabId }); // Grau = gleich
  }
}
```

### 1.7 Standort-Score — Umgebungsbewertung

Das Plugin berechnet für jede besuchte Anzeige einen **Standort-Score** basierend auf der Adresse/Koordinaten. Die Daten kommen ausschließlich von **OpenStreetMap** (ODbL-Lizenz, frei nutzbar — auch kommerziell).

#### Datenquelle: OpenStreetMap Overpass API

```
Endpunkt: https://overpass-api.de/api/interpreter
Lizenz: ODbL (Open Database License) — kommerzielle Nutzung erlaubt
Pflicht: Quellennennung "© OpenStreetMap contributors"
Rate Limit: Max 2 Requests pro Sekunde, Cache-Pflicht
```

**WICHTIG:** Die Overpass-Requests gehen an `overpass-api.de`, NICHT an das Immobilienportal. Sie werden aus dem Background Service Worker gesendet, nicht aus dem Content Script. Die Zielwebseite kann diese Requests nicht sehen.

#### Geocoding: Adresse → Koordinaten

Falls die Anzeige nur eine Adresse enthält (kein Lat/Lng), wird über Nominatim geocodiert:

```
Endpunkt: https://nominatim.openstreetmap.org/search
Pflicht: User-Agent Header mit App-Name und Kontakt-E-Mail
Rate Limit: Max 1 Request pro Sekunde
```

#### Score-Kategorien

Der Gesamt-Score (0-100) setzt sich aus drei Teilscores zusammen:

**1. Familienfreundlichkeit (0-100, Gewichtung: 40%)**

Overpass-Query sucht im Umkreis (Standard: 1.5km) nach:

| OSM-Tag | Was | Punkte |
|---------|-----|--------|
| `amenity=school` | Schulen (Grund-, Mittel-, Realschule, Gymnasium) | +10 pro Schule (max 30) |
| `amenity=kindergarten` | Kindergärten/Kitas | +8 pro Kita (max 24) |
| `leisure=park` | Parks und Grünanlagen | +5 pro Park (max 20) |
| `leisure=playground` | Spielplätze | +5 pro Spielplatz (max 15) |
| `leisure=sports_centre` / `leisure=pitch` | Sportplätze, Sportzentren | +4 pro Anlage (max 16) |
| `leisure=swimming_pool` / `sport=swimming` | Schwimmbäder | +6 pro Bad (max 12) |
| `amenity=library` | Bibliotheken | +5 pro Bibliothek (max 10) |
| `amenity=cinema` / `amenity=theatre` | Kino, Theater | +4 pro Einrichtung (max 8) |
| `tourism=museum` | Museen | +3 pro Museum (max 6) |

Normalisierung: Rohpunkte / Maximalpunkte * 100

**2. ÖPNV-Anbindung (0-100, Gewichtung: 35%)**

| OSM-Tag / Methode | Was | Punkte |
|-------------------|-----|--------|
| `highway=bus_stop` / `public_transport=stop_position` | Bushaltestellen im Umkreis 500m | +5 pro Haltestelle (max 25) |
| `railway=tram_stop` | Straßenbahn-Haltestellen 500m | +8 pro Haltestelle (max 24) |
| `railway=station` / `railway=halt` | Bahnhöfe/S-Bahn 1.5km | +15 pro Bahnhof (max 30) |
| `railway=subway_entrance` | U-Bahn-Eingänge 800m | +12 pro Eingang (max 24) |
| Haltestellen-Dichte | Anzahl Haltestellen in 300m Radius | Bonus: >3 = +10, >5 = +15 |
| Nähe zum Hauptbahnhof | Distanz zum nächsten `railway=station` mit `name~Hauptbahnhof\|Hbf` | <2km: +15, <5km: +10, <10km: +5 |

Für die **Frequenz** (wie oft angefahren wird): OSM enthält teilweise `route=bus`/`route=tram` Relations. Wenn vorhanden, zähle die Anzahl verschiedener Linien pro Haltestelle als Indikator. Exakte Fahrpläne sind NICHT in OSM → kein Scraping von VGN/DB nötig.

**3. Aussicht & Umgebungsqualität (0-100, Gewichtung: 25%)**

Dieser Score bewertet die visuelle/akustische Qualität der Umgebung.

**Positive Faktoren (Punkte addieren):**

| OSM-Tag | Was | Punkte |
|---------|-----|--------|
| `natural=wood` / `landuse=forest` | Wald in 500m Radius | +15 |
| `natural=water` / `waterway=river` | Gewässer (Fluss, See) in 500m | +12 |
| `leisure=park` + `area > 10000m²` | Große Parkanlage in 300m | +10 |
| `leisure=garden` / `leisure=nature_reserve` | Gärten, Naturschutzgebiete 1km | +8 |
| `landuse=farmland` / `landuse=meadow` | Ländliche Umgebung 500m | +8 |
| Geringe Gebäudedichte | Wenige `building=*` Objekte in 200m Radius (<20) | +10 |

**Negative Faktoren (Punkte abziehen):**

| OSM-Tag | Was | Punkte |
|---------|-----|--------|
| `highway=motorway` / `highway=trunk` | Autobahn/Schnellstraße in 300m | -20 |
| `highway=primary` | Große Hauptstraße in 150m | -10 |
| `railway=rail` (kein station) | Bahngleise in 200m (Lärm) | -8 |
| `landuse=industrial` | Industriegebiet in 500m | -15 |
| `landuse=commercial` + hohe Dichte | Großes Gewerbegebiet in 300m | -8 |
| `building=apartments` Cluster | >10 große Wohnblöcke in 200m Radius | -10 |
| `aeroway=aerodrome` | Flughafen in 3km | -12 |

Normalisierung: (50 + Rohpunkte) clamped auf 0-100

#### Overpass-Query Beispiel

```typescript
// scoring/overpass.ts

const OVERPASS_URL = "https://overpass-api.de/api/interpreter";

interface OverpassResult {
  elements: Array<{
    type: string;
    id: number;
    lat?: number;
    lon?: number;
    tags?: Record<string, string>;
  }>;
}

async function queryOverpass(lat: number, lon: number, radius: number, tags: string[]): Promise<OverpassResult> {
  const tagFilters = tags.map(t => `node${t}(around:${radius},${lat},${lon});`).join("\n");

  const query = `
    [out:json][timeout:10];
    (
      ${tagFilters}
    );
    out center;
  `;

  const response = await fetch(OVERPASS_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `data=${encodeURIComponent(query)}`,
  });

  return response.json();
}

// Beispiel: Familienfreundlichkeit abfragen
async function queryFamilyPOIs(lat: number, lon: number): Promise<OverpassResult> {
  const query = `
    [out:json][timeout:15];
    (
      node["amenity"="school"](around:1500,${lat},${lon});
      node["amenity"="kindergarten"](around:1500,${lat},${lon});
      node["leisure"="park"](around:1500,${lat},${lon});
      way["leisure"="park"](around:1500,${lat},${lon});
      node["leisure"="playground"](around:1500,${lat},${lon});
      node["leisure"="sports_centre"](around:1500,${lat},${lon});
      node["leisure"="pitch"](around:1500,${lat},${lon});
      way["leisure"="pitch"](around:1500,${lat},${lon});
      node["leisure"="swimming_pool"](around:1500,${lat},${lon});
      node["amenity"="library"](around:1500,${lat},${lon});
      node["amenity"="cinema"](around:1500,${lat},${lon});
      node["amenity"="theatre"](around:1500,${lat},${lon});
    );
    out center;
  `;

  const response = await fetch(OVERPASS_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `data=${encodeURIComponent(query)}`,
  });

  return response.json();
}
```

#### Score-Engine

```typescript
// scoring/score-engine.ts

interface StandortScore {
  gesamt: number;           // 0-100
  familie: number;          // 0-100
  oepnv: number;            // 0-100
  aussicht: number;         // 0-100
  details: {
    familie: FamilieDetails;
    oepnv: OepnvDetails;
    aussicht: AussichtDetails;
  };
  berechnetAm: number;      // Timestamp
  koordinaten: { lat: number; lon: number };
}

interface FamilieDetails {
  schulen: number;
  kindergaerten: number;
  parks: number;
  spielplaetze: number;
  sportplaetze: number;
  schwimmbaeder: number;
  bibliotheken: number;
  kultur: number;           // Kino + Theater + Museum
}

interface OepnvDetails {
  busHaltestellen: number;
  tramHaltestellen: number;
  bahnhoefe: number;
  ubahn: number;
  haltestellenDichte300m: number;
  distanzHbfKm: number | null;
  linienAnzahl: number;
}

interface AussichtDetails {
  waldNaehe: boolean;
  gewaesserNaehe: boolean;
  grosserPark: boolean;
  naturschutz: boolean;
  laendlich: boolean;
  gebaeudeGering: boolean;
  autobahnNaehe: boolean;    // Negativ
  hauptstrasseNaehe: boolean; // Negativ
  gleiseNaehe: boolean;       // Negativ
  industrieNaehe: boolean;    // Negativ
  gewerbeNaehe: boolean;      // Negativ
  hochhausCluster: boolean;   // Negativ
  flughafenNaehe: boolean;    // Negativ
}

function calculateGesamtScore(score: StandortScore): number {
  return Math.round(
    score.familie * 0.40 +
    score.oepnv * 0.35 +
    score.aussicht * 0.25
  );
}
```

#### Caching

Overpass-Abfragen sind teuer (Netzwerk + Server-Last). Caching ist Pflicht:

```typescript
// scoring/cache.ts

/**
 * Geo-Cache: Speichert Score-Ergebnisse basierend auf gerundeten Koordinaten.
 * Rundung auf 3 Dezimalstellen ≈ 111m Genauigkeit.
 * Wenn ein neuer Standort innerhalb von 111m eines gecachten Standorts liegt,
 * wird der gecachte Score wiederverwendet.
 *
 * Cache-Dauer: 30 Tage (OSM-Daten ändern sich selten)
 * Storage: chrome.storage.local mit Prefix "geo_cache:"
 */

function getCacheKey(lat: number, lon: number): string {
  return `geo_cache:${lat.toFixed(3)},${lon.toFixed(3)}`;
}
```

#### Integration in den Service Worker

Wenn ein Content Script eine Anzeige meldet, wird zusätzlich zum Preis-Tracking der Standort-Score berechnet:

1. Content Script sendet Adresse/Koordinaten mit der `LISTING_DETECTED` Message
2. Background Worker prüft den Geo-Cache
3. Falls kein Cache: Geocoding (Nominatim) → Overpass-Queries → Score berechnen → cachen
4. Score wird im `TrackedListing`-Objekt gespeichert
5. Popup/Sidebar zeigt den Score an

#### Datenmodell-Erweiterung

```typescript
// Erweitere TrackedListing um:
interface TrackedListing {
  // ... bestehende Felder ...

  /** Koordinaten des Standorts */
  coordinates?: { lat: number; lon: number };
  /** Berechneter Standort-Score */
  standortScore?: StandortScore;
}

// Erweitere ListingMessage um:
interface ListingMessage {
  type: "LISTING_DETECTED";
  data: {
    // ... bestehende Felder ...

    /** Adresse für Geocoding (falls keine Koordinaten) */
    address?: string;
    /** Koordinaten falls vom Portal bereitgestellt */
    lat?: number;
    lon?: number;
  };
}
```

#### UI-Anzeige im Popup

Der Score wird im Popup als kompakte Übersicht angezeigt:

```
┌──────────────────────────────────┐
│ 📍 Standort-Score: 74/100       │
│ ██████████████░░░░░░ 74%        │
│                                  │
│ 👨‍👩‍👧‍👦 Familie:    82/100  ████████░░ │
│    3 Schulen, 2 Kitas, 4 Parks  │
│                                  │
│ 🚌 ÖPNV:         71/100  ███████░░░ │
│    5 Haltestellen, 2.1km zum Hbf│
│                                  │
│ 🏞️ Umgebung:     65/100  ██████░░░░ │
│    Wald in Nähe, aber Hauptstr.  │
└──────────────────────────────────┘
```

Farbkodierung:
- 80-100: Grün (Sehr gut)
- 60-79: Gelbgrün (Gut)
- 40-59: Orange (Mittel)
- 20-39: Rot-Orange (Unterdurchschnittlich)
- 0-19: Rot (Schlecht)

#### Quellennennung (PFLICHT)

Im Popup/Sidebar muss immer stehen:
> "Standortdaten: © OpenStreetMap contributors (ODbL)"

### 1.8 Popup UI

Das Popup öffnet sich beim Klick auf das Extension-Icon. Es zeigt:

1. **Aktuelle Seite** — Falls der Nutzer gerade auf einer Anzeige ist:
   - Titel, Portal, Ort
   - Aktueller Preis
   - Preis beim ersten Besuch
   - Prozentuale Änderung (farblich: rot=teurer, grün=günstiger)
   - Datum des ersten und letzten Besuchs
   - Mini-Chart mit Preisverlauf (einfache Linie)
   - **Standort-Score** (Gesamt + 3 Teilscores mit Kurzinfo)
   - Klappbare Details pro Score-Kategorie (Anzahl Schulen, Haltestellen etc.)

2. **Letzte Änderungen** — Liste der zuletzt besuchten Anzeigen mit Preisänderungen

3. **Top/Flop** — Anzeigen sortiert nach bestem/schlechtestem Standort-Score

4. **Statistik** — Anzahl getrackter Anzeigen pro Portal

**Design:** Schlicht, professionell, dunkles oder helles Theme. Keine Spielereien. Makler wollen schnell Infos sehen.

**Breite:** 400px (Standard-Popup-Breite)
**Höhe:** Max 600px, scrollbar

### 1.8 Sidebar Panel

Alternativ zum Popup kann der Nutzer eine Sidebar öffnen die dauerhaft neben der Webseite angezeigt wird. Sie zeigt dieselben Informationen wie das Popup, hat aber mehr Platz für:

- Ausführlichere Preishistorie-Tabelle
- Größerer Chart
- Filter nach Portal, Zeitraum, Preisänderungs-Richtung
- Export als CSV (nur lokale Daten des Nutzers)

### 1.9 Speicher-Management

- `chrome.storage.local` hat ein Limit von ~10MB (erweiterbar über `unlimitedStorage` Permission)
- Alte Einträge (>1 Jahr nicht besucht) automatisch bereinigen
- Nutzer kann manuell Einträge löschen
- Export/Import-Funktion für Backup (JSON-Datei, lokal)

---

## Teil 2: Web-App — MaklerToolkit

### 2.1 Features

#### Feature 1: Stadtteil-Analyse (Open Data)

**Datenquellen (alle frei nutzbar):**
- OpenStreetMap (ODbL-Lizenz): Schulen, Supermärkte, ÖPNV-Haltestellen, Parks, Restaurants
- Statistisches Bundesamt / Bayerisches Landesamt für Statistik: Einwohnerzahlen, Altersstruktur
- Bundesagentur für Arbeit: Arbeitslosenquote pro Region

**Funktionalität:**
- Interaktive Karte mit Stadtteilen von Erlangen, Fürth, Nürnberg
- Stadtteil-Score basierend auf: Infrastruktur, Anbindung, Nahversorgung, Grünflächen
- Vergleich zweier Stadtteile nebeneinander
- Quellennennung für alle verwendeten Daten

#### Feature 2: Kaufnebenkosten-Rechner

**Komplett eigene Berechnung basierend auf gesetzlichen Formeln:**
- Grunderwerbsteuer: 3,5% (Bayern)
- Notarkosten: ~1,5% (Staffelung nach GNotKG)
- Grundbuchgebühren: ~0,5%
- Maklerprovision: Konfigurierbar (mit Teilungsregelung seit 23.12.2020)
- Monatliche Belastung bei verschiedenen Zinssätzen und Tilgungsraten
- Eingabefelder: Kaufpreis, Eigenkapital, Zinssatz, Tilgung, Zinsbindung

#### Feature 3: Mietpreisspiegel

**Datenquellen:**
- Offizielle Mietspiegel der Städte Nürnberg, Erlangen, Fürth (öffentliche Dokumente)
- Nutzer gibt ein: Baujahr, Lage, Ausstattung, Größe
- App berechnet ortsübliche Vergleichsmiete
- Zeigt ob eine Miete über/unter dem Spiegel liegt

#### Feature 4: Exposé-Generator

**Keine externen Daten — nur Makler-Eingaben:**
- Makler gibt Objektdaten ein (Adresse, Preis, Fläche, Zimmer, Ausstattung, Bilder)
- App generiert professionelles PDF-Exposé
- Individuelle Vorlagen mit Makler-Branding (Logo, Farben, Kontakt)
- Automatische Pflichtangaben: EnEV/GEG Energieausweis-Infos
- QR-Code zum Online-Exposé

#### Feature 5: Mini-CRM

**Nur eigene Daten des Maklers:**
- Interessenten-Verwaltung (Name, Kontakt, Suchkriterien)
- Objekt-Verwaltung (eigene Inserate des Maklers)
- Matching: Welcher Interessent passt zu welchem Objekt
- Besichtigungstermine planen und tracken
- Nachfass-Erinnerungen
- DSGVO-konform: Einwilligungsverwaltung, Löschfunktion, Datenexport

#### Feature 6: Bodenrichtwert-Anzeige (eingeschränkt)

**Bayern:**
- WMS-Kartenlayer einbetten als unverändertes Bild: `https://geoservices.bayern.de/wms/v1/ogc_bodenrichtwerte.cgi`
- Quellennennung: "Bodenrichtwerte Bayern"
- Hinweis anzeigen: "Keine amtliche Auskunft. Für verbindliche Werte wenden Sie sich an den zuständigen Gutachterausschuss."
- KEINE Rohdaten extrahieren, KEINE Werte speichern, KEINE Bearbeitung (CC BY-ND)
- Für kommerzielle Nutzung: Lizenz beim LDBV einholen!

**NRW/Niedersachsen (falls später expandiert):**
- Dort sind WFS-Dienste mit Rohdaten frei nutzbar
- Datenlizenz Deutschland — Namensnennung 2.0
- Kommerzielle Nutzung erlaubt

### 2.2 Datenbank-Schema (PostgreSQL + PostGIS)

```sql
-- Nutzer / Makler
CREATE TABLE makler (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    display_name TEXT NOT NULL,
    company_name TEXT,
    phone TEXT,
    logo_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Interessenten des Maklers
CREATE TABLE interessenten (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    makler_id UUID REFERENCES makler(id) ON DELETE CASCADE,
    vorname TEXT NOT NULL,
    nachname TEXT NOT NULL,
    email TEXT,
    telefon TEXT,
    notizen TEXT,
    suchkriterien JSONB, -- { min_preis, max_preis, min_flaeche, zimmer, stadtteile[] }
    dsgvo_einwilligung_am TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Objekte des Maklers (eigene Inserate)
CREATE TABLE objekte (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    makler_id UUID REFERENCES makler(id) ON DELETE CASCADE,
    titel TEXT NOT NULL,
    beschreibung TEXT,
    adresse TEXT,
    plz TEXT,
    stadt TEXT,
    location GEOMETRY(POINT, 4326),
    preis NUMERIC,
    listing_type TEXT CHECK (listing_type IN ('miete', 'kauf')),
    wohnflaeche NUMERIC,
    grundstueck NUMERIC,
    zimmer NUMERIC,
    baujahr INTEGER,
    energieausweis JSONB,
    ausstattung JSONB,
    bilder TEXT[], -- URLs zu selbst hochgeladenen Bildern
    status TEXT DEFAULT 'aktiv' CHECK (status IN ('aktiv', 'reserviert', 'verkauft', 'vermietet')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Besichtigungstermine
CREATE TABLE termine (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    makler_id UUID REFERENCES makler(id) ON DELETE CASCADE,
    objekt_id UUID REFERENCES objekte(id) ON DELETE SET NULL,
    interessent_id UUID REFERENCES interessenten(id) ON DELETE SET NULL,
    termin_datum TIMESTAMPTZ NOT NULL,
    notizen TEXT,
    status TEXT DEFAULT 'geplant' CHECK (status IN ('geplant', 'durchgefuehrt', 'abgesagt')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Stadtteil-Daten (aus Open Data, periodisch aktualisiert)
CREATE TABLE stadtteile (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    stadt TEXT NOT NULL,
    boundary GEOMETRY(POLYGON, 4326),
    einwohner INTEGER,
    infrastruktur_score NUMERIC,
    anbindung_score NUMERIC,
    nahversorgung_score NUMERIC,
    gruen_score NUMERIC,
    gesamt_score NUMERIC,
    datenstand DATE,
    quellenangabe TEXT NOT NULL -- Pflicht: Datenherkunft dokumentieren
);
```

### 2.3 API-Endpunkte

```
POST   /api/auth/register
POST   /api/auth/login
POST   /api/auth/logout

GET    /api/objekte
POST   /api/objekte
GET    /api/objekte/:id
PUT    /api/objekte/:id
DELETE /api/objekte/:id

GET    /api/interessenten
POST   /api/interessenten
GET    /api/interessenten/:id
PUT    /api/interessenten/:id
DELETE /api/interessenten/:id

GET    /api/interessenten/:id/matching  -- Passende Objekte

GET    /api/termine
POST   /api/termine
PUT    /api/termine/:id

GET    /api/stadtteile
GET    /api/stadtteile/:id
GET    /api/stadtteile/vergleich?a=:id&b=:id

POST   /api/rechner/kaufnebenkosten
POST   /api/rechner/mietspiegel

POST   /api/expose/generate  -- PDF-Generierung
GET    /api/expose/:id.pdf

-- DSGVO
GET    /api/dsgvo/export     -- Alle eigenen Daten als JSON
DELETE /api/dsgvo/account     -- Account und alle Daten löschen
```

### 2.4 UI-Struktur

```
/ (Landing Page — Produktbeschreibung, Pricing)
/login
/register
/dashboard
  /dashboard/objekte
  /dashboard/objekte/neu
  /dashboard/objekte/:id
  /dashboard/objekte/:id/expose
  /dashboard/interessenten
  /dashboard/interessenten/:id
  /dashboard/termine
  /dashboard/karte (Stadtteil-Analyse + Bodenrichtwerte)
  /dashboard/rechner (Kaufnebenkosten + Mietspiegel)
  /dashboard/einstellungen (Profil, Branding, DSGVO)
/impressum
/datenschutz
```

---

## Teil 3: Rechtliche Seiten (PFLICHT)

### 3.1 Impressum (§ 5 DDG)

Muss enthalten:
- Vollständiger Name und Anschrift des Anbieters
- E-Mail und Telefon
- USt-IdNr. falls vorhanden
- Zuständige Aufsichtsbehörde falls zutreffend
- Verantwortlich für den Inhalt nach § 18 MStV

### 3.2 Datenschutzerklärung

Muss beschreiben:
- Welche Daten erhoben werden (Makler-Account, Interessenten, Objekte)
- Rechtsgrundlage (Art. 6 Abs. 1 lit. b DSGVO — Vertragserfüllung)
- Speicherdauer
- Betroffenenrechte (Auskunft, Löschung, Portabilität, Widerspruch)
- Kontakt des Datenschutzbeauftragten (falls Pflicht)
- Hinweis auf Beschwerderecht bei der Aufsichtsbehörde

### 3.3 Browser-Extension Datenschutzhinweis

Für den Chrome Web Store / Firefox Add-ons:
- Erklären: "Alle Daten werden ausschließlich lokal in Ihrem Browser gespeichert"
- "Es werden keine Daten an unsere Server oder Dritte übertragen"
- "Die Extension liest lediglich öffentlich sichtbare Preisinformationen von Webseiten die Sie manuell besuchen"

---

## Teil 4: Monetarisierung

### Preismodell

```
Basis (kostenlos):
  - Preis-Tracker Plugin (max. 20 Einträge)
  - Kaufnebenkosten-Rechner

Starter (19 EUR/Monat):
  - Preis-Tracker Plugin (unbegrenzt)
  - Stadtteil-Analyse
  - Mietpreisspiegel
  - Kaufnebenkosten-Rechner

Pro (39 EUR/Monat):
  - Alles aus Starter
  - Exposé-Generator (unbegrenzt)
  - Mini-CRM
  - Bodenrichtwert-Karte
  - CSV-Export
  - Prioritäts-Support
```

### Zahlungsabwicklung
- Stripe für Abo-Verwaltung
- Rechnungsstellung mit korrekter USt (19%)
- 14-Tage Testphase für Pro

---

## Zusammenfassung der Reihenfolge

**Phase 1 — MVP (Browser-Extension):**
1. Content Scripts für Kleinanzeigen.de und WG-Gesucht (niedrigstes Risiko)
2. Background Service Worker mit Storage
3. Popup UI mit Preisvergleich
4. Badge-Anzeige
5. Standort-Score Engine (Overpass API + Nominatim + Caching)
6. Standort-Score Anzeige im Popup (3 Kategorien + Gesamt)
7. Testen, testen, testen — sicherstellen dass kein DOM verändert wird

**Phase 2 — Web-App Basis:**
6. Next.js Setup mit Auth
7. Kaufnebenkosten-Rechner
8. Impressum + Datenschutz
9. Landing Page mit Pricing

**Phase 3 — Web-App Features:**
10. Stadtteil-Analyse mit OpenStreetMap
11. Mietpreisspiegel
12. Exposé-Generator
13. Mini-CRM

**Phase 4 — Erweiterung:**
14. Immowelt und ImmobilienScout24 Content Scripts (nach Rechtsberatung!)
15. Bodenrichtwert-Karte (nach LDBV-Lizenzklärung)
16. Sidebar Panel
17. Firefox-Version der Extension
