# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Projektübersicht

**SchweizerMakler** ist ein Browser-Extension + Web-App Toolkit für Immobilienmakler im Raum Erlangen/Fürth/Nürnberg (Bayern):

1. **Browser-Extension** (Chrome + Firefox) — Preis-Tracker + Standort-Score. Speichert Preise lokal beim manuellen Seitenbesuch und bewertet die Umgebung via OpenStreetMap.
2. **Web-App** (MaklerToolkit) — Dashboard mit Stadtteil-Analyse, Kaufnebenkosten-Rechner, Exposé-Generator, Mietpreisspiegel, Mini-CRM.

Vollständige Implementierungsspec: `Docs/Prompt.md`. Rechtsanalyse-Verweis: `Docs/Rechtsanalyse.md`.

## Rechtliche Rahmenbedingungen — KRITISCH

Alle Entwickler MÜSSEN folgende Regeln einhalten. Verstöße können zu Abmahnungen/Vertragsstrafen führen.

### Browser-Extension: Erkennungsschutz

**VERBOTEN:**
- DOM der Zielwebseite verändern (kein Overlay, kein injiziertes HTML/CSS, kein `document.createElement()`, kein `classList.add()`)
- CSS in die Seite einfügen (kein `<style>`, kein `insertRule()`)
- `window`-Objekt der Seite modifizieren oder Variablen injizieren
- Zusätzliche HTTP-Requests an die Zielwebseite oder deren API senden
- `fetch()`/`XMLHttpRequest`/WebSocket an Portal-Domains aus dem Content Script
- Personendaten scrapen (Namen, E-Mails, Telefonnummern von Inserenten)
- Vollständige Beschreibungstexte kopieren oder Bilder herunterladen

**ERLAUBT:**
- Content Script liest existierende DOM-Elemente per `document.querySelector()` (in `world: "ISOLATED"`)
- Daten via `chrome.runtime.sendMessage()` an Background Service Worker senden
- Anzeige über Popup, Sidebar-Panel oder Badge auf dem Extension-Icon

**ANTI-DETECTION PFLICHT:**
- Alle DOM-Reads in `requestIdleCallback()` oder `setTimeout()` wrappen (Timing-Fingerprinting vermeiden)
- Keine deterministischen Timing-Patterns (zufällige Delays verwenden)
- Content Scripts laufen in `world: "ISOLATED"` (Manifest V3) — keinen Zugriff auf `window`-Variablen der Seite

**DATEN:**
- **Nur lokale Speicherung** — `chrome.storage.local` (kein Sync!), kein zentraler Server, keine geteilte Datenbank
- Kein Cloud-Sync

### Portal-Risikobewertung

| Portal | Risiko | Hinweis |
|--------|--------|---------|
| kleinanzeigen.de | Gering | AGB verbieten nur Bots/Crawler, kein Plugin-Verbot |
| wg-gesucht.de | Gering | Keine spezifischen Plugin-Verbote |
| immowelt.de | Mittel | § 9.3 AGB: "jenseits privater Benutzung" verboten |
| immobilienscout24.de | **Hoch** | "Data Extraction" verboten, Vertragsstrafe bis 50.000 EUR. Parser muss besonders minimal sein. |

### Web-App: DSGVO-Pflichten

- Impressum (§ 5 DDG), Datenschutzerklärung, Cookie-Banner
- Betroffenenrechte (Art. 15-21 DSGVO): Auskunft, Löschung, Export
- Verarbeitungsverzeichnis führen

## Tech Stack

### Browser-Extension
- **Manifest V3** (Chrome) / WebExtension API (Firefox), TypeScript, Webpack
- Content Script → Background Service Worker → Popup/Sidebar (Datenfluss unidirektional)
- Storage: `chrome.storage.local`
- Geodaten: OpenStreetMap Overpass API + Nominatim (ODbL-Lizenz)

### Web-App (MaklerToolkit)
- Next.js 15 (App Router), TypeScript, Tailwind CSS
- PostgreSQL + PostGIS, JWT-Auth
- Geodaten: OpenStreetMap (ODbL), WMS-Dienste (Bodenrichtwerte Bayern)

## Architektur

### Extension: Datenfluss

```
Portal-Seite → Content Script (DOM lesen) → chrome.runtime.sendMessage()
    → Background Service Worker:
        1. Preis-Tracking: Speichern/Aktualisieren in chrome.storage.local
        2. Standort-Score: Geocoding (Nominatim) → Overpass-Queries → Score berechnen → cachen
        3. Badge aktualisieren (NEU / ↑X% / ↓X% / =)
    → Popup/Sidebar liest Daten aus storage
```

- Pro Portal ein eigenes Content Script (unterschiedliches HTML/Selektoren)
- Overpass/Nominatim-Requests nur aus dem Background Worker (nicht Content Script!)
- Geo-Cache: Koordinaten auf 3 Dezimalstellen gerundet (~111m), 30 Tage gültig, Prefix `geo_cache:`

### Extension: Standort-Score (0-100)

Gewichtung: Familie 40% + ÖPNV 35% + Aussicht/Umgebung 25%. Details in `Docs/Prompt.md` Abschnitt 1.7.

### Web-App: Module

- **Stadtteil-Analyse**: Interaktive Karte Erlangen/Fürth/Nürnberg, Open Data-basierte Scores
- **Kaufnebenkosten-Rechner**: Bayern-spezifisch (3,5% GrESt), GNotKG-Staffelung
- **Mietpreisspiegel**: Offizielle Mietspiegel Nürnberg/Erlangen/Fürth
- **Exposé-Generator**: PDF-Erzeugung mit Makler-Branding, EnEV/GEG-Pflichtangaben
- **Mini-CRM**: Interessenten, Objekte, Matching, Termine, DSGVO-Einwilligungsverwaltung
- **Bodenrichtwerte**: WMS-Layer als unverändertes Bild (CC BY-ND), keine Rohdaten extrahieren

### OpenStreetMap-Pflichten

- Quellennennung im UI: `"© OpenStreetMap contributors (ODbL)"`
- Overpass API: Max 2 Requests/Sekunde, Cache-Pflicht
- Nominatim: Max 1 Request/Sekunde, User-Agent mit App-Name und Kontakt-E-Mail Pflicht

## Entwicklungskommandos

```bash
# Extension
cd extension && npm install
npm run dev              # Entwicklung mit Hot Reload
npm run build            # Chrome Production Build
npm run build:firefox    # Firefox Build

# Web-App
cd webapp && npm install
npm run dev              # Dev Server (localhost:3000)
npm run build            # Production Build
npm run test             # Tests
```

## Architektur-Entscheidungen

- **Kein zentraler Server für Extension**: Würde eine verteilte Scraping-Datenbank darstellen → hohes Abmahnrisiko
- **Kein DOM-Overlay**: Websites erkennen DOM-Änderungen via MutationObserver. Popup/Sidebar/Badge laufen außerhalb des Seiten-Kontexts
- **Manifest V3**: Chrome erzwingt V3 seit 2024, V2 wird nicht mehr akzeptiert
- **1 Content Script pro Portal**: Unterschiedliches HTML, separate Selektoren halten den Code wartbar
