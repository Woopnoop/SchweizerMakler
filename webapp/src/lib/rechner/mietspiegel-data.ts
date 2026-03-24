// ============================================================
// Mietpreisspiegel — Beispieldaten für Erlangen, Fürth, Nürnberg
// ============================================================
//
// WICHTIG / IMPORTANT:
// Dies sind BEISPIELDATEN ("sample data") und KEINE offiziellen Werte.
// Vor produktivem Einsatz MÜSSEN die Werte anhand der offiziellen
// Mietspiegel-Publikationen der jeweiligen Stadt verifiziert werden.
//
// Quellen für offizielle Mietspiegel:
//   - Nürnberg: Stadt Nürnberg, Amt für Wohnen und Stadtentwicklung
//   - Erlangen: Stadt Erlangen, Amt für Stadtentwicklung und Stadtplanung
//   - Fürth: Stadt Fürth, Amt für Soziales, Wohnen und Senioren
// ============================================================

export interface MietspiegelEntry {
  /** Baujahr-Klasse, z.B. "vor 1918", "1919-1948" */
  baujahr_klasse: string;
  /** Wohnlage: "einfach" | "mittel" | "gut" */
  lage: string;
  /** Ausstattung: "einfach" | "mittel" | "gut" | "gehoben" */
  ausstattung: string;
  /** Flächenklasse, z.B. "unter 40m²", "40-60m²" */
  flaeche_klasse: string;
  /** Mindest-Nettokaltmiete EUR/m² */
  min: number;
  /** Mittlere Nettokaltmiete EUR/m² */
  mitte: number;
  /** Maximale Nettokaltmiete EUR/m² */
  max: number;
}

export interface StadtMietspiegel {
  stadt: string;
  quellenangabe: string;
  gueltig_bis: string;
  eintraege: MietspiegelEntry[];
}

export const BAUJAHR_KLASSEN = [
  "vor 1918",
  "1919-1948",
  "1949-1968",
  "1969-1990",
  "1991-2000",
  "2001-2010",
  "nach 2010",
] as const;

export const LAGEN = ["einfach", "mittel", "gut"] as const;

export const AUSSTATTUNGEN = ["einfach", "mittel", "gut", "gehoben"] as const;

export const FLAECHE_KLASSEN = [
  "unter 40m²",
  "40-60m²",
  "60-90m²",
  "über 90m²",
] as const;

/**
 * Ordnet eine Wohnfläche einer Flächenklasse zu.
 */
export function flaecheZuKlasse(wohnflaeche: number): string {
  if (wohnflaeche < 40) return "unter 40m²";
  if (wohnflaeche < 60) return "40-60m²";
  if (wohnflaeche < 90) return "60-90m²";
  return "über 90m²";
}

/**
 * Ordnet ein konkretes Baujahr einer Baujahr-Klasse zu.
 */
export function baujahrZuKlasse(baujahr: number): string {
  if (baujahr < 1919) return "vor 1918";
  if (baujahr <= 1948) return "1919-1948";
  if (baujahr <= 1968) return "1949-1968";
  if (baujahr <= 1990) return "1969-1990";
  if (baujahr <= 2000) return "1991-2000";
  if (baujahr <= 2010) return "2001-2010";
  return "nach 2010";
}

// ============================================================
// BEISPIELDATEN — Bitte mit offiziellen Mietspiegeln abgleichen!
// ============================================================

function generateEntries(
  baseMultiplier: number,
): MietspiegelEntry[] {
  const entries: MietspiegelEntry[] = [];

  // Multiplikatoren für Baujahr (älter → günstiger)
  const baujahrFactors: Record<string, number> = {
    "vor 1918": 0.85,
    "1919-1948": 0.82,
    "1949-1968": 0.88,
    "1969-1990": 0.93,
    "1991-2000": 1.0,
    "2001-2010": 1.08,
    "nach 2010": 1.18,
  };

  // Multiplikatoren für Lage
  const lageFactors: Record<string, number> = {
    einfach: 0.82,
    mittel: 1.0,
    gut: 1.2,
  };

  // Multiplikatoren für Ausstattung
  const ausstattungFactors: Record<string, number> = {
    einfach: 0.78,
    mittel: 1.0,
    gut: 1.15,
    gehoben: 1.32,
  };

  // Multiplikatoren für Fläche (kleine Wohnungen → höherer qm-Preis)
  const flaecheFactors: Record<string, number> = {
    "unter 40m²": 1.15,
    "40-60m²": 1.05,
    "60-90m²": 1.0,
    "über 90m²": 0.92,
  };

  for (const baujahr of BAUJAHR_KLASSEN) {
    for (const lage of LAGEN) {
      for (const ausstattung of AUSSTATTUNGEN) {
        for (const flaeche of FLAECHE_KLASSEN) {
          const factor =
            baseMultiplier *
            baujahrFactors[baujahr] *
            lageFactors[lage] *
            ausstattungFactors[ausstattung] *
            flaecheFactors[flaeche];

          const mitte = Math.round(factor * 100) / 100;
          const min = Math.round(mitte * 0.82 * 100) / 100;
          const max = Math.round(mitte * 1.18 * 100) / 100;

          entries.push({
            baujahr_klasse: baujahr,
            lage,
            ausstattung,
            flaeche_klasse: flaeche,
            min,
            mitte,
            max,
          });
        }
      }
    }
  }

  return entries;
}

// BEISPIELDATEN — Bitte mit offiziellen Mietspiegeln abgleichen!
export const mietspiegelDaten: StadtMietspiegel[] = [
  {
    stadt: "nuernberg",
    quellenangabe:
      "Beispieldaten angelehnt an den Mietspiegel Nürnberg — KEINE offiziellen Werte. Bitte verifizieren unter: stadt.nuernberg.de",
    gueltig_bis: "2026-12-31",
    eintraege: generateEntries(9.2),
  },
  {
    stadt: "erlangen",
    quellenangabe:
      "Beispieldaten angelehnt an den Mietspiegel Erlangen — KEINE offiziellen Werte. Bitte verifizieren unter: erlangen.de",
    gueltig_bis: "2026-12-31",
    eintraege: generateEntries(11.5),
  },
  {
    stadt: "fuerth",
    quellenangabe:
      "Beispieldaten angelehnt an den Mietspiegel Fürth — KEINE offiziellen Werte. Bitte verifizieren unter: fuerth.de",
    gueltig_bis: "2026-12-31",
    eintraege: generateEntries(8.8),
  },
];
