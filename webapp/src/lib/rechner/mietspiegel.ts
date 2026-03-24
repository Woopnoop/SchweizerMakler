// ============================================================
// Mietpreisspiegel — Berechnungslogik
// ============================================================

import {
  mietspiegelDaten,
  baujahrZuKlasse,
  flaecheZuKlasse,
  type MietspiegelEntry,
} from "./mietspiegel-data";

export interface MietspiegelInput {
  /** Stadt-Key: "nuernberg" | "erlangen" | "fuerth" */
  stadt: string;
  /** Konkretes Baujahr (z.B. 1965) oder Baujahr-Klasse (z.B. "1949-1968") */
  baujahr: number | string;
  /** Wohnlage: "einfach" | "mittel" | "gut" */
  lage: string;
  /** Ausstattung: "einfach" | "mittel" | "gut" | "gehoben" */
  ausstattung: string;
  /** Wohnfläche in m² */
  wohnflaeche: number;
  /** Optional: aktuelle Kaltmiete in EUR (gesamt, nicht pro m²) */
  aktuelleMiete?: number;
}

export interface MietspiegelResult {
  /** Ortsübliche Miete: Minimum pro m² */
  ortsueblicheMieteMin: number;
  /** Ortsübliche Miete: Mitte pro m² */
  ortsueblicheMieteMitte: number;
  /** Ortsübliche Miete: Maximum pro m² */
  ortsueblicheMieteMax: number;
  /** Pro Quadratmeter (min/mitte/max) */
  proQm: { min: number; mitte: number; max: number };
  /** Gesamtmiete basierend auf Wohnfläche (min/mitte/max) */
  gesamt: { min: number; mitte: number; max: number };
  /** Vergleich mit aktueller Miete (nur wenn aktuelleMiete angegeben) */
  vergleich?: {
    /** Liegt die aktuelle Miete über dem Mietspiegelwert (Mitte)? */
    ueberSpiegel: boolean;
    /** Differenz zur Mitte in Prozent (positiv = über Spiegel) */
    differenzProzent: number;
    /** Differenz zur Mitte in EUR */
    differenzAbsolut: number;
  };
  /** Quellenangabe */
  quellenangabe: string;
  /** Gültig bis */
  gueltigBis: string;
}

/**
 * Berechnet die ortsübliche Vergleichsmiete anhand des Mietspiegels.
 *
 * WICHTIG: Die zugrunde liegenden Daten sind Beispieldaten und müssen
 * vor produktivem Einsatz mit den offiziellen Mietspiegel-Publikationen
 * abgeglichen werden.
 */
export function berechneMietspiegel(
  input: MietspiegelInput,
): MietspiegelResult {
  const { stadt, baujahr, lage, ausstattung, wohnflaeche, aktuelleMiete } =
    input;

  // Stadt-Daten finden
  const stadtDaten = mietspiegelDaten.find(
    (s) => s.stadt === stadt.toLowerCase(),
  );

  if (!stadtDaten) {
    throw new Error(`Keine Mietspiegeldaten für Stadt "${stadt}" vorhanden.`);
  }

  // Baujahr-Klasse ermitteln
  const baujahrKlasse =
    typeof baujahr === "number" ? baujahrZuKlasse(baujahr) : baujahr;

  // Flächenklasse ermitteln
  const flaecheKlasse = flaecheZuKlasse(wohnflaeche);

  // Passenden Eintrag suchen
  const eintrag = stadtDaten.eintraege.find(
    (e: MietspiegelEntry) =>
      e.baujahr_klasse === baujahrKlasse &&
      e.lage === lage &&
      e.ausstattung === ausstattung &&
      e.flaeche_klasse === flaecheKlasse,
  );

  if (!eintrag) {
    throw new Error(
      `Kein Mietspiegeleintrag gefunden für: ${baujahrKlasse}, ${lage}, ${ausstattung}, ${flaecheKlasse}`,
    );
  }

  // Gesamtmiete berechnen
  const gesamtMin = round2(eintrag.min * wohnflaeche);
  const gesamtMitte = round2(eintrag.mitte * wohnflaeche);
  const gesamtMax = round2(eintrag.max * wohnflaeche);

  const result: MietspiegelResult = {
    ortsueblicheMieteMin: eintrag.min,
    ortsueblicheMieteMitte: eintrag.mitte,
    ortsueblicheMieteMax: eintrag.max,
    proQm: {
      min: eintrag.min,
      mitte: eintrag.mitte,
      max: eintrag.max,
    },
    gesamt: {
      min: gesamtMin,
      mitte: gesamtMitte,
      max: gesamtMax,
    },
    quellenangabe: stadtDaten.quellenangabe,
    gueltigBis: stadtDaten.gueltig_bis,
  };

  // Vergleich mit aktueller Miete
  if (aktuelleMiete !== undefined && aktuelleMiete > 0) {
    const differenzAbsolut = round2(aktuelleMiete - gesamtMitte);
    const differenzProzent =
      gesamtMitte > 0
        ? round2(((aktuelleMiete - gesamtMitte) / gesamtMitte) * 100)
        : 0;

    result.vergleich = {
      ueberSpiegel: aktuelleMiete > gesamtMitte,
      differenzProzent,
      differenzAbsolut,
    };
  }

  return result;
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}
