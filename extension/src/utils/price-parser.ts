/**
 * Preis-Parsing für deutsche Immobilienportale.
 * Handles: "250.000 €", "250.000,00 EUR", "1.200 €/Monat", "250.000 VB" etc.
 */

/** Deutsche Preisformatierung parsen → Zahl in EUR */
export function parseGermanPrice(text: string): number | null {
  if (!text) return null;

  // Alles außer Zahlen, Punkt, Komma entfernen
  let cleaned = text.replace(/[^\d.,]/g, "").trim();
  if (!cleaned) return null;

  // Deutsches Format: Punkt = Tausender, Komma = Dezimal
  // "250.000,00" → "250000.00"
  // "250.000" → "250000"
  // "1.200" → "1200"
  if (cleaned.includes(",")) {
    // Komma vorhanden → alles vor Komma: Punkte sind Tausender
    cleaned = cleaned.replace(/\./g, "").replace(",", ".");
  } else {
    // Kein Komma → Punkte sind Tausender (z.B. "250.000")
    // Ausnahme: nur ein Punkt mit ≤2 Nachkommastellen (z.B. "12.50")
    const dotParts = cleaned.split(".");
    if (dotParts.length === 2 && dotParts[1].length <= 2 && dotParts[0].length <= 3) {
      // Wahrscheinlich Dezimaltrennzeichen (z.B. "9.50")
    } else {
      cleaned = cleaned.replace(/\./g, "");
    }
  }

  const num = parseFloat(cleaned);
  return isNaN(num) || num <= 0 ? null : num;
}

/** Listing-Typ erkennen (Miete oder Kauf) */
export function detectListingType(text: string, url: string): "miete" | "kauf" {
  const combined = `${text} ${url}`.toLowerCase();

  const mieteKeywords = [
    "miete", "mietwohnung", "kaltmiete", "warmmiete", "/monat",
    "€/monat", "eur/monat", "mietpreis", "zur miete", "wg-zimmer",
    "mietwohnungen", "mieten",
  ];

  const kaufKeywords = [
    "kaufpreis", "kaufen", "eigentumswohnung", "haus kaufen",
    "zum kauf", "verkauf", "vb", "provisionsfrei",
  ];

  const mieteScore = mieteKeywords.filter((kw) => combined.includes(kw)).length;
  const kaufScore = kaufKeywords.filter((kw) => combined.includes(kw)).length;

  return mieteScore >= kaufScore ? "miete" : "kauf";
}

/** Wohnfläche in m² parsen */
export function parseArea(text: string): number | null {
  if (!text) return null;

  // "85 m²", "85,5 m2", "85.5 qm", "ca. 85 m²"
  const match = text.match(/([\d.,]+)\s*(?:m²|m2|qm)/i);
  if (!match) return null;

  const num = parseFloat(match[1].replace(",", "."));
  return isNaN(num) || num <= 0 ? null : num;
}

/** Zimmeranzahl parsen */
export function parseRooms(text: string): number | null {
  if (!text) return null;

  // "3 Zimmer", "3,5 Zi.", "3.5 Zimmer", "3-Zimmer"
  const match = text.match(/([\d.,]+)\s*(?:Zimmer|Zi\.?|Räume|Raum|-Zimmer)/i);
  if (!match) return null;

  const num = parseFloat(match[1].replace(",", "."));
  return isNaN(num) || num <= 0 ? null : num;
}
