/**
 * HTML-basierte Exposé-Vorlage.
 * Generiert ein druckfähiges HTML-Dokument das als PDF gespeichert werden kann
 * (Browser: Strg+P → PDF speichern oder serverseitg via Puppeteer).
 *
 * EnEV/GEG Pflichtangaben sind im Exposé enthalten (gesetzlich vorgeschrieben
 * bei gewerblicher Immobilienwerbung).
 */

interface ExposeData {
  // Objekt
  titel: string;
  beschreibung?: string;
  adresse?: string;
  plz?: string;
  stadt?: string;
  preis?: string;
  listingType: string;
  wohnflaeche?: string;
  grundstueck?: string;
  zimmer?: string;
  baujahr?: number;
  status: string;
  // Energieausweis (PFLICHT)
  energieausweis?: {
    art?: string;
    endenergiebedarf?: number;
    effizienzklasse?: string;
    energietraeger?: string;
    baujahrHeizung?: number;
  };
  // Makler
  maklerName: string;
  maklerCompany?: string;
  maklerPhone?: string;
  maklerEmail: string;
  maklerLogo?: string;
}

export function generateExposeHtml(data: ExposeData): string {
  const priceLabel = data.listingType === "miete" ? "Kaltmiete" : "Kaufpreis";

  return `<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <title>Exposé — ${escHtml(data.titel)}</title>
  <style>
    @page { size: A4; margin: 20mm; }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', Arial, sans-serif; color: #1a1a1a; font-size: 11pt; line-height: 1.5; }
    .page { page-break-after: always; min-height: 250mm; }
    .page:last-child { page-break-after: auto; }

    /* Header */
    .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 3px solid #2563eb; padding-bottom: 12px; margin-bottom: 24px; }
    .header h1 { font-size: 22pt; color: #2563eb; max-width: 70%; }
    .header .logo { max-height: 60px; }
    .makler-info { text-align: right; font-size: 9pt; color: #666; }

    /* Facts */
    .facts-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px 24px; margin: 20px 0; }
    .fact { display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid #eee; }
    .fact-label { color: #666; }
    .fact-value { font-weight: 600; }
    .price { font-size: 18pt; font-weight: 700; color: #2563eb; margin: 16px 0; }

    /* Sections */
    h2 { font-size: 14pt; color: #2563eb; margin: 24px 0 12px; padding-bottom: 4px; border-bottom: 1px solid #e5e7eb; }
    .description { white-space: pre-wrap; }

    /* Energieausweis */
    .energie { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; margin-top: 16px; }
    .energie h3 { font-size: 12pt; margin-bottom: 8px; color: #374151; }
    .energie-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 4px 16px; font-size: 10pt; }
    .energie-label { color: #666; }

    /* Footer */
    .footer { margin-top: 32px; padding-top: 12px; border-top: 2px solid #2563eb; font-size: 9pt; color: #666; display: flex; justify-content: space-between; }
    .disclaimer { font-size: 8pt; color: #999; margin-top: 16px; }
  </style>
</head>
<body>

<div class="page">
  <!-- Header -->
  <div class="header">
    <h1>${escHtml(data.titel)}</h1>
    <div class="makler-info">
      ${data.maklerCompany ? `<strong>${escHtml(data.maklerCompany)}</strong><br>` : ""}
      ${escHtml(data.maklerName)}<br>
      ${data.maklerPhone ? `Tel: ${escHtml(data.maklerPhone)}<br>` : ""}
      ${escHtml(data.maklerEmail)}
    </div>
  </div>

  <!-- Preis -->
  <div class="price">${priceLabel}: ${data.preis ?? "Auf Anfrage"}${data.listingType === "miete" ? " / Monat" : ""}</div>

  <!-- Eckdaten -->
  <div class="facts-grid">
    ${data.adresse ? fact("Adresse", `${data.adresse}, ${data.plz ?? ""} ${data.stadt ?? ""}`) : ""}
    ${data.wohnflaeche ? fact("Wohnfläche", `${data.wohnflaeche} m²`) : ""}
    ${data.grundstueck ? fact("Grundstück", `${data.grundstueck} m²`) : ""}
    ${data.zimmer ? fact("Zimmer", data.zimmer) : ""}
    ${data.baujahr ? fact("Baujahr", String(data.baujahr)) : ""}
    ${fact("Art", data.listingType === "miete" ? "Zur Miete" : "Zum Kauf")}
    ${fact("Status", data.status)}
  </div>

  <!-- Beschreibung -->
  ${data.beschreibung ? `
  <h2>Beschreibung</h2>
  <div class="description">${escHtml(data.beschreibung)}</div>
  ` : ""}

  <!-- Energieausweis (PFLICHT nach GEG) -->
  <div class="energie">
    <h3>Energieausweis (gem. GEG)</h3>
    ${data.energieausweis ? `
    <div class="energie-grid">
      ${data.energieausweis.art ? `<span class="energie-label">Ausweisart:</span><span>${escHtml(data.energieausweis.art === "bedarfsausweis" ? "Bedarfsausweis" : "Verbrauchsausweis")}</span>` : ""}
      ${data.energieausweis.endenergiebedarf != null ? `<span class="energie-label">Endenergiebedarf:</span><span>${data.energieausweis.endenergiebedarf} kWh/(m²·a)</span>` : ""}
      ${data.energieausweis.effizienzklasse ? `<span class="energie-label">Effizienzklasse:</span><span>${escHtml(data.energieausweis.effizienzklasse)}</span>` : ""}
      ${data.energieausweis.energietraeger ? `<span class="energie-label">Energieträger:</span><span>${escHtml(data.energieausweis.energietraeger)}</span>` : ""}
      ${data.energieausweis.baujahrHeizung ? `<span class="energie-label">Baujahr Heizung:</span><span>${data.energieausweis.baujahrHeizung}</span>` : ""}
    </div>
    ` : `<p style="color: #ef4444; font-size: 10pt;">⚠ Energieausweisdaten fehlen. Pflichtangabe bei gewerblicher Immobilienwerbung.</p>`}
  </div>

  <!-- Footer -->
  <div class="footer">
    <div>${data.maklerCompany ? escHtml(data.maklerCompany) : escHtml(data.maklerName)}</div>
    <div>Erstellt am ${new Date().toLocaleDateString("de-DE")}</div>
  </div>

  <div class="disclaimer">
    Alle Angaben ohne Gewähr. Irrtümer und Zwischenverkauf vorbehalten.
    Die Weitergabe dieses Exposés an Dritte ohne Zustimmung des Maklers ist untersagt.
  </div>
</div>

</body>
</html>`;
}

function fact(label: string, value: string): string {
  return `<div class="fact"><span class="fact-label">${escHtml(label)}</span><span class="fact-value">${escHtml(value)}</span></div>`;
}

function escHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
