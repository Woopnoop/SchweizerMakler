/**
 * Generiert Favicon und App-Icons für das MaklerToolkit.
 * Gleiches Design wie das Extension-Icon (süßes Haus mit rotem Dach).
 */

const sharp = require("sharp");
const path = require("path");

const PUBLIC_DIR = path.join(__dirname, "..", "public");

function createSvg(size) {
  const showDetails = size >= 48;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 128 128">
  <defs>
    <linearGradient id="sky" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" style="stop-color:#7DD3FC"/>
      <stop offset="100%" style="stop-color:#38BDF8"/>
    </linearGradient>
  </defs>

  <rect x="4" y="4" width="120" height="120" rx="24" fill="url(#sky)"/>

  ${showDetails ? `
  <ellipse cx="30" cy="24" rx="14" ry="6" fill="white" opacity="0.5"/>
  <ellipse cx="100" cy="18" rx="10" ry="5" fill="white" opacity="0.4"/>
  ` : ""}

  <rect x="4" y="86" width="120" height="38" rx="0" fill="#4ADE80" opacity="0.6"/>
  <rect x="4" y="100" width="120" height="24" rx="0 0 24 24" fill="#22C55E" opacity="0.4"/>

  <rect x="80" y="28" width="10" height="24" rx="2" fill="#7F1D1D"/>
  <rect x="78" y="26" width="14" height="4" rx="1" fill="#991B1B"/>

  ${showDetails ? `
  <circle cx="85" cy="20" r="4" fill="#D1D5DB" opacity="0.5"/>
  <circle cx="89" cy="13" r="3" fill="#D1D5DB" opacity="0.4"/>
  <circle cx="84" cy="8" r="2.5" fill="#D1D5DB" opacity="0.3"/>
  ` : ""}

  <polygon points="64,20 22,58 106,58" fill="#DC2626"/>
  <polygon points="64,20 22,58 106,58" fill="none" stroke="#B91C1C" stroke-width="1.5"/>
  <polygon points="64,20 106,58 64,58" fill="#B91C1C" opacity="0.2"/>

  <rect x="32" y="58" width="64" height="38" fill="#FEF3C7"/>
  <rect x="32" y="58" width="64" height="38" fill="none" stroke="#F59E0B" stroke-width="0.5" opacity="0.4"/>

  <rect x="55" y="72" width="18" height="24" rx="2" fill="#78350F"/>
  <rect x="55" y="72" width="18" height="24" rx="2" fill="none" stroke="#451A03" stroke-width="0.5"/>
  ${showDetails ? `<circle cx="70" cy="85" r="1.8" fill="#FDE68A"/>` : ""}

  <rect x="38" y="64" width="13" height="11" rx="1.5" fill="#FDE68A"/>
  <rect x="38" y="64" width="13" height="11" rx="1.5" fill="none" stroke="#D97706" stroke-width="0.7"/>
  ${showDetails ? `
  <line x1="44.5" y1="64" x2="44.5" y2="75" stroke="#D97706" stroke-width="0.5"/>
  <line x1="38" y1="69.5" x2="51" y2="69.5" stroke="#D97706" stroke-width="0.5"/>
  ` : ""}

  <rect x="77" y="64" width="13" height="11" rx="1.5" fill="#FDE68A"/>
  <rect x="77" y="64" width="13" height="11" rx="1.5" fill="none" stroke="#D97706" stroke-width="0.7"/>
  ${showDetails ? `
  <line x1="83.5" y1="64" x2="83.5" y2="75" stroke="#D97706" stroke-width="0.5"/>
  <line x1="77" y1="69.5" x2="90" y2="69.5" stroke="#D97706" stroke-width="0.5"/>
  ` : ""}

  ${size >= 128 ? `
  <g transform="translate(48, 38) scale(0.7)" fill="#FCA5A5" opacity="0.8">
    <path d="M12,4 C12,4 8,0 5,0 C2,0 0,2.5 0,5 C0,9 12,16 12,16 C12,16 24,9 24,5 C24,2.5 22,0 19,0 C16,0 12,4 12,4Z"/>
  </g>
  ` : ""}
</svg>`;
}

async function generate() {
  // Favicon (32x32)
  await sharp(Buffer.from(createSvg(32))).resize(32, 32).png().toFile(path.join(PUBLIC_DIR, "favicon.png"));
  console.log("  ✓ favicon.png");

  // ICO-Alternative (wird als favicon.ico geladen)
  await sharp(Buffer.from(createSvg(32))).resize(32, 32).png().toFile(path.join(PUBLIC_DIR, "favicon.ico"));
  console.log("  ✓ favicon.ico");

  // Apple Touch Icon
  await sharp(Buffer.from(createSvg(180))).resize(180, 180).png().toFile(path.join(PUBLIC_DIR, "apple-touch-icon.png"));
  console.log("  ✓ apple-touch-icon.png");

  // OG Image / App Icon
  await sharp(Buffer.from(createSvg(512))).resize(512, 512).png().toFile(path.join(PUBLIC_DIR, "icon-512.png"));
  console.log("  ✓ icon-512.png");

  console.log("Webapp Icons generiert!");
}

generate().catch(console.error);
