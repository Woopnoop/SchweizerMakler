/**
 * Generiert Extension-Icons (16/48/128px) mit eingebetteter Versionsnummer.
 * Liest die Version aus der ROOT/VERSION Datei.
 *
 * Logo: Blaues Haus-Icon mit Preis-Chart-Linie + Version unten.
 */

const sharp = require("sharp");
const fs = require("fs");
const path = require("path");

const ICONS_DIR = path.join(__dirname, "..", "icons");
const VERSION_FILE = path.join(__dirname, "..", "..", "VERSION");

// Version lesen
const version = fs.readFileSync(VERSION_FILE, "utf-8").trim();
console.log(`Generiere Icons für Version ${version}...`);

// SVG-Template für das Logo
function createSvg(size) {
  const showVersion = size >= 48;
  const versionFontSize = size === 128 ? 20 : 10;
  const versionY = size === 128 ? 120 : 44;

  // Skalierungsfaktor
  const s = size / 128;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 128 128">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#2563eb"/>
      <stop offset="100%" style="stop-color:#1d4ed8"/>
    </linearGradient>
    <linearGradient id="chart" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" style="stop-color:#22c55e"/>
      <stop offset="100%" style="stop-color:#16a34a"/>
    </linearGradient>
  </defs>

  <!-- Hintergrund: Abgerundetes Quadrat -->
  <rect x="4" y="4" width="120" height="120" rx="24" fill="url(#bg)"/>

  <!-- Haus-Silhouette -->
  <g fill="white" opacity="0.95">
    <!-- Dach (Dreieck) -->
    <polygon points="64,22 28,56 100,56"/>
    <!-- Hauswand -->
    <rect x="36" y="56" width="56" height="40" rx="2"/>
    <!-- Tür -->
    <rect x="54" y="70" width="20" height="26" rx="2" fill="#2563eb"/>
    <!-- Fenster links -->
    <rect x="42" y="62" width="12" height="10" rx="1" fill="#2563eb"/>
    <!-- Fenster rechts -->
    <rect x="74" y="62" width="12" height="10" rx="1" fill="#2563eb"/>
  </g>

  <!-- Preis-Chart-Linie (unten rechts, über dem Haus) -->
  <polyline
    points="30,90 50,82 65,86 80,72 98,60"
    fill="none"
    stroke="#22c55e"
    stroke-width="4"
    stroke-linecap="round"
    stroke-linejoin="round"
    opacity="0.9"
  />
  <!-- Pfeil am Ende der Chart-Linie -->
  <polygon points="98,60 90,58 92,66" fill="#22c55e" opacity="0.9"/>

  ${showVersion ? `
  <!-- Version -->
  <rect x="24" y="${versionY - versionFontSize + 2}" width="80" height="${versionFontSize + 6}" rx="${versionFontSize / 3}" fill="rgba(0,0,0,0.4)"/>
  <text x="64" y="${versionY + 2}" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-weight="bold" font-size="${versionFontSize}" fill="white" letter-spacing="0.5">v${version}</text>
  ` : ""}
</svg>`;
}

// Icons generieren
async function generate() {
  const sizes = [16, 48, 128];

  for (const size of sizes) {
    const svg = createSvg(size);
    const outputPath = path.join(ICONS_DIR, `icon${size}.png`);

    await sharp(Buffer.from(svg))
      .resize(size, size)
      .png()
      .toFile(outputPath);

    console.log(`  ✓ icon${size}.png`);
  }

  console.log("Icons erfolgreich generiert!");
}

generate().catch((err) => {
  console.error("Fehler bei Icon-Generierung:", err);
  process.exit(1);
});
