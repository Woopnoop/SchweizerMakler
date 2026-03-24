// ============================================================
// Kaufnebenkosten-Rechner — Pure Calculation Logic
// Bayern-spezifisch: Grunderwerbsteuer 3,5 %
// ============================================================

export interface KaufnebenkostenInput {
  /** Kaufpreis in EUR */
  kaufpreis: number;
  /** Eigenkapital in EUR */
  eigenkapital: number;
  /** Maklerprovision in Prozent (z.B. 3.57) */
  maklerprovision: number;
  /** Jaehrlicher Sollzinssatz in Prozent (z.B. 3.5) */
  zinssatz: number;
  /** Anfaengliche Tilgung in Prozent (z.B. 2.0) */
  tilgung: number;
  /** Zinsbindung in Jahren */
  zinsbindung: number;
}

export interface KaufnebenkostenResult {
  /** Grunderwerbsteuer (3,5 % in Bayern) */
  grunderwerbsteuer: number;
  /** Notarkosten (~1,5 %) */
  notarkosten: number;
  /** Grundbuchgebuehren (~0,5 %) */
  grundbuchgebuehren: number;
  /** Maklerprovision in EUR */
  maklerProvisionAbsolut: number;
  /** Summe aller Nebenkosten */
  nebenkostenGesamt: number;
  /** Kaufpreis + Nebenkosten */
  gesamtkosten: number;
  /** Gesamtkosten - Eigenkapital */
  darlehenssumme: number;
  /** Monatliche Annuitaetenrate */
  monatlicheRate: number;
  /** Gesamtzinsen ueber die Zinsbindung */
  zinsKostenZinsbindung: number;
  /** Restschuld nach Ende der Zinsbindung */
  restschuldNachZinsbindung: number;
}

export function berechneKaufnebenkosten(
  input: KaufnebenkostenInput,
): KaufnebenkostenResult {
  const {
    kaufpreis,
    eigenkapital,
    maklerprovision,
    zinssatz,
    tilgung,
    zinsbindung,
  } = input;

  // --- Nebenkosten ---
  const grunderwerbsteuer = kaufpreis * 0.035;
  const notarkosten = kaufpreis * 0.015;
  const grundbuchgebuehren = kaufpreis * 0.005;
  const maklerProvisionAbsolut = kaufpreis * (maklerprovision / 100);

  const nebenkostenGesamt =
    grunderwerbsteuer + notarkosten + grundbuchgebuehren + maklerProvisionAbsolut;

  const gesamtkosten = kaufpreis + nebenkostenGesamt;
  const darlehenssumme = Math.max(gesamtkosten - eigenkapital, 0);

  // --- Annuitaetenberechnung ---
  const jahresZins = zinssatz / 100;
  const monatsZins = jahresZins / 12;
  const anzahlMonate = zinsbindung * 12;

  let monatlicheRate = 0;
  let zinsKostenZinsbindung = 0;
  let restschuldNachZinsbindung = darlehenssumme;

  if (darlehenssumme > 0 && jahresZins > 0) {
    // Annuitaetenrate = Darlehenssumme * (Zins + Tilgung) / 12
    monatlicheRate = (darlehenssumme * (jahresZins + tilgung / 100)) / 12;

    // Monatsweise Tilgungsplan fuer Zinsbindung berechnen
    let restschuld = darlehenssumme;
    let gesamtZinsen = 0;

    for (let monat = 0; monat < anzahlMonate; monat++) {
      const zinsAnteil = restschuld * monatsZins;
      const tilgungsAnteil = monatlicheRate - zinsAnteil;
      gesamtZinsen += zinsAnteil;
      restschuld -= tilgungsAnteil;

      if (restschuld <= 0) {
        restschuld = 0;
        break;
      }
    }

    zinsKostenZinsbindung = round2(gesamtZinsen);
    restschuldNachZinsbindung = round2(Math.max(restschuld, 0));
  } else if (darlehenssumme > 0 && jahresZins === 0) {
    // Zinsfreier Kredit (theoretisch): nur Tilgung
    monatlicheRate = (darlehenssumme * (tilgung / 100)) / 12;
    const getilgt = monatlicheRate * anzahlMonate;
    restschuldNachZinsbindung = round2(Math.max(darlehenssumme - getilgt, 0));
  }

  return {
    grunderwerbsteuer: round2(grunderwerbsteuer),
    notarkosten: round2(notarkosten),
    grundbuchgebuehren: round2(grundbuchgebuehren),
    maklerProvisionAbsolut: round2(maklerProvisionAbsolut),
    nebenkostenGesamt: round2(nebenkostenGesamt),
    gesamtkosten: round2(gesamtkosten),
    darlehenssumme: round2(darlehenssumme),
    monatlicheRate: round2(monatlicheRate),
    zinsKostenZinsbindung,
    restschuldNachZinsbindung,
  };
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}
