// ============================================================
// Gemeinsame Beispieldaten für die Stadtteil-Analyse
// Umkreis ~50 km um Fürth (49.477, 10.989)
// ============================================================

export interface SampleDistrict {
  id: string;
  name: string;
  stadt: string; // municipality/town name (lowercase)
  landkreis: string; // landkreis ID (lowercase, hyphenated)
  einwohner: number;
  infrastrukturScore: string; // "0"-"100"
  anbindungScore: string;
  nahversorgungScore: string;
  gruenScore: string;
  gesamtScore: string;
  quellenangabe: string;
}

const Q = "Beispieldaten — © OpenStreetMap contributors (ODbL)";

export const SAMPLE_DISTRICTS: SampleDistrict[] = [
  // ──────────────────────────────────────────────────────────
  // 1. Stadt Nürnberg
  // ──────────────────────────────────────────────────────────
  { id: "nu-01", name: "Altstadt", stadt: "nuernberg", landkreis: "stadt-nuernberg", einwohner: 6500, infrastrukturScore: "95", anbindungScore: "98", nahversorgungScore: "95", gruenScore: "38", gesamtScore: "82", quellenangabe: Q },
  { id: "nu-02", name: "Gostenhof", stadt: "nuernberg", landkreis: "stadt-nuernberg", einwohner: 11500, infrastrukturScore: "85", anbindungScore: "88", nahversorgungScore: "88", gruenScore: "42", gesamtScore: "76", quellenangabe: Q },
  { id: "nu-03", name: "St. Johannis", stadt: "nuernberg", landkreis: "stadt-nuernberg", einwohner: 14000, infrastrukturScore: "90", anbindungScore: "92", nahversorgungScore: "90", gruenScore: "55", gesamtScore: "82", quellenangabe: Q },
  { id: "nu-04", name: "Maxfeld", stadt: "nuernberg", landkreis: "stadt-nuernberg", einwohner: 8200, infrastrukturScore: "88", anbindungScore: "90", nahversorgungScore: "85", gruenScore: "50", gesamtScore: "78", quellenangabe: Q },
  { id: "nu-05", name: "Wöhrd", stadt: "nuernberg", landkreis: "stadt-nuernberg", einwohner: 7800, infrastrukturScore: "82", anbindungScore: "86", nahversorgungScore: "84", gruenScore: "58", gesamtScore: "78", quellenangabe: Q },
  { id: "nu-06", name: "Langwasser", stadt: "nuernberg", landkreis: "stadt-nuernberg", einwohner: 22000, infrastrukturScore: "75", anbindungScore: "82", nahversorgungScore: "80", gruenScore: "72", gesamtScore: "77", quellenangabe: Q },
  { id: "nu-07", name: "Mögeldorf", stadt: "nuernberg", landkreis: "stadt-nuernberg", einwohner: 9800, infrastrukturScore: "72", anbindungScore: "70", nahversorgungScore: "74", gruenScore: "80", gesamtScore: "74", quellenangabe: Q },
  { id: "nu-08", name: "Gartenstadt", stadt: "nuernberg", landkreis: "stadt-nuernberg", einwohner: 8400, infrastrukturScore: "68", anbindungScore: "72", nahversorgungScore: "70", gruenScore: "82", gesamtScore: "73", quellenangabe: Q },
  { id: "nu-09", name: "Ziegelstein", stadt: "nuernberg", landkreis: "stadt-nuernberg", einwohner: 7500, infrastrukturScore: "70", anbindungScore: "72", nahversorgungScore: "70", gruenScore: "78", gesamtScore: "73", quellenangabe: Q },
  { id: "nu-10", name: "Thon", stadt: "nuernberg", landkreis: "stadt-nuernberg", einwohner: 6800, infrastrukturScore: "65", anbindungScore: "68", nahversorgungScore: "65", gruenScore: "75", gesamtScore: "68", quellenangabe: Q },

  // ──────────────────────────────────────────────────────────
  // 2. Stadt Fürth
  // ──────────────────────────────────────────────────────────
  { id: "fu-01", name: "Altstadt", stadt: "fuerth", landkreis: "stadt-fuerth", einwohner: 12000, infrastrukturScore: "90", anbindungScore: "92", nahversorgungScore: "94", gruenScore: "45", gesamtScore: "80", quellenangabe: Q },
  { id: "fu-02", name: "Südstadt", stadt: "fuerth", landkreis: "stadt-fuerth", einwohner: 15000, infrastrukturScore: "82", anbindungScore: "88", nahversorgungScore: "85", gruenScore: "52", gesamtScore: "77", quellenangabe: Q },
  { id: "fu-03", name: "Eigenes Heim", stadt: "fuerth", landkreis: "stadt-fuerth", einwohner: 6800, infrastrukturScore: "76", anbindungScore: "78", nahversorgungScore: "72", gruenScore: "68", gesamtScore: "74", quellenangabe: Q },
  { id: "fu-04", name: "Ronhof", stadt: "fuerth", landkreis: "stadt-fuerth", einwohner: 4200, infrastrukturScore: "72", anbindungScore: "70", nahversorgungScore: "65", gruenScore: "72", gesamtScore: "70", quellenangabe: Q },
  { id: "fu-05", name: "Poppenreuth", stadt: "fuerth", landkreis: "stadt-fuerth", einwohner: 5800, infrastrukturScore: "62", anbindungScore: "58", nahversorgungScore: "55", gruenScore: "82", gesamtScore: "64", quellenangabe: Q },
  { id: "fu-06", name: "Stadeln", stadt: "fuerth", landkreis: "stadt-fuerth", einwohner: 6100, infrastrukturScore: "55", anbindungScore: "52", nahversorgungScore: "58", gruenScore: "88", gesamtScore: "63", quellenangabe: Q },
  { id: "fu-07", name: "Unterfarrnbach", stadt: "fuerth", landkreis: "stadt-fuerth", einwohner: 4800, infrastrukturScore: "58", anbindungScore: "55", nahversorgungScore: "52", gruenScore: "85", gesamtScore: "63", quellenangabe: Q },
  { id: "fu-08", name: "Burgfarrnbach", stadt: "fuerth", landkreis: "stadt-fuerth", einwohner: 8500, infrastrukturScore: "50", anbindungScore: "48", nahversorgungScore: "55", gruenScore: "90", gesamtScore: "61", quellenangabe: Q },

  // ──────────────────────────────────────────────────────────
  // 3. Stadt Erlangen
  // ──────────────────────────────────────────────────────────
  { id: "er-01", name: "Altstadt", stadt: "erlangen", landkreis: "stadt-erlangen", einwohner: 8500, infrastrukturScore: "92", anbindungScore: "90", nahversorgungScore: "94", gruenScore: "48", gesamtScore: "81", quellenangabe: Q },
  { id: "er-02", name: "Bruck", stadt: "erlangen", landkreis: "stadt-erlangen", einwohner: 9200, infrastrukturScore: "80", anbindungScore: "85", nahversorgungScore: "82", gruenScore: "62", gesamtScore: "77", quellenangabe: Q },
  { id: "er-03", name: "Tennenlohe", stadt: "erlangen", landkreis: "stadt-erlangen", einwohner: 5800, infrastrukturScore: "65", anbindungScore: "60", nahversorgungScore: "62", gruenScore: "88", gesamtScore: "69", quellenangabe: Q },
  { id: "er-04", name: "Eltersdorf", stadt: "erlangen", landkreis: "stadt-erlangen", einwohner: 5200, infrastrukturScore: "58", anbindungScore: "55", nahversorgungScore: "60", gruenScore: "85", gesamtScore: "65", quellenangabe: Q },
  { id: "er-05", name: "Sieglitzhof", stadt: "erlangen", landkreis: "stadt-erlangen", einwohner: 4800, infrastrukturScore: "82", anbindungScore: "78", nahversorgungScore: "75", gruenScore: "70", gesamtScore: "76", quellenangabe: Q },
  { id: "er-06", name: "Röthelheimpark", stadt: "erlangen", landkreis: "stadt-erlangen", einwohner: 6200, infrastrukturScore: "88", anbindungScore: "82", nahversorgungScore: "85", gruenScore: "75", gesamtScore: "83", quellenangabe: Q },
  { id: "er-07", name: "Büchenbach", stadt: "erlangen", landkreis: "stadt-erlangen", einwohner: 11000, infrastrukturScore: "75", anbindungScore: "72", nahversorgungScore: "80", gruenScore: "68", gesamtScore: "74", quellenangabe: Q },

  // ──────────────────────────────────────────────────────────
  // 4. Stadt Schwabach
  // ──────────────────────────────────────────────────────────
  { id: "sw-01", name: "Schwabach Innenstadt", stadt: "schwabach", landkreis: "stadt-schwabach", einwohner: 12000, infrastrukturScore: "72", anbindungScore: "68", nahversorgungScore: "78", gruenScore: "55", gesamtScore: "68", quellenangabe: Q },
  { id: "sw-02", name: "Wolkersdorf", stadt: "schwabach", landkreis: "stadt-schwabach", einwohner: 3200, infrastrukturScore: "40", anbindungScore: "35", nahversorgungScore: "42", gruenScore: "88", gesamtScore: "51", quellenangabe: Q },
  { id: "sw-03", name: "Penzendorf", stadt: "schwabach", landkreis: "stadt-schwabach", einwohner: 4100, infrastrukturScore: "45", anbindungScore: "40", nahversorgungScore: "48", gruenScore: "85", gesamtScore: "55", quellenangabe: Q },

  // ──────────────────────────────────────────────────────────
  // 5. LK Erlangen-Höchstadt
  // ──────────────────────────────────────────────────────────
  { id: "erh-01", name: "Herzogenaurach", stadt: "herzogenaurach", landkreis: "erlangen-hoechstadt", einwohner: 24000, infrastrukturScore: "68", anbindungScore: "55", nahversorgungScore: "72", gruenScore: "72", gesamtScore: "67", quellenangabe: Q },
  { id: "erh-02", name: "Höchstadt a.d.Aisch", stadt: "hoechstadt", landkreis: "erlangen-hoechstadt", einwohner: 13500, infrastrukturScore: "60", anbindungScore: "48", nahversorgungScore: "65", gruenScore: "75", gesamtScore: "62", quellenangabe: Q },
  { id: "erh-03", name: "Eckental", stadt: "eckental", landkreis: "erlangen-hoechstadt", einwohner: 14000, infrastrukturScore: "55", anbindungScore: "52", nahversorgungScore: "60", gruenScore: "80", gesamtScore: "62", quellenangabe: Q },
  { id: "erh-04", name: "Baiersdorf", stadt: "baiersdorf", landkreis: "erlangen-hoechstadt", einwohner: 8000, infrastrukturScore: "50", anbindungScore: "58", nahversorgungScore: "55", gruenScore: "78", gesamtScore: "60", quellenangabe: Q },
  { id: "erh-05", name: "Uttenreuth", stadt: "uttenreuth", landkreis: "erlangen-hoechstadt", einwohner: 5200, infrastrukturScore: "42", anbindungScore: "45", nahversorgungScore: "48", gruenScore: "85", gesamtScore: "55", quellenangabe: Q },
  { id: "erh-06", name: "Buckenhof", stadt: "buckenhof", landkreis: "erlangen-hoechstadt", einwohner: 3800, infrastrukturScore: "38", anbindungScore: "42", nahversorgungScore: "40", gruenScore: "88", gesamtScore: "52", quellenangabe: Q },
  { id: "erh-07", name: "Spardorf", stadt: "spardorf", landkreis: "erlangen-hoechstadt", einwohner: 4500, infrastrukturScore: "40", anbindungScore: "44", nahversorgungScore: "45", gruenScore: "82", gesamtScore: "53", quellenangabe: Q },
  { id: "erh-08", name: "Möhrendorf", stadt: "moehrendorf", landkreis: "erlangen-hoechstadt", einwohner: 4800, infrastrukturScore: "38", anbindungScore: "40", nahversorgungScore: "45", gruenScore: "85", gesamtScore: "52", quellenangabe: Q },
  { id: "erh-09", name: "Adelsdorf", stadt: "adelsdorf", landkreis: "erlangen-hoechstadt", einwohner: 8200, infrastrukturScore: "42", anbindungScore: "35", nahversorgungScore: "50", gruenScore: "82", gesamtScore: "52", quellenangabe: Q },

  // ──────────────────────────────────────────────────────────
  // 6. LK Fürth
  // ──────────────────────────────────────────────────────────
  { id: "ful-01", name: "Zirndorf", stadt: "zirndorf", landkreis: "fuerth-land", einwohner: 26000, infrastrukturScore: "65", anbindungScore: "62", nahversorgungScore: "70", gruenScore: "68", gesamtScore: "66", quellenangabe: Q },
  { id: "ful-02", name: "Oberasbach", stadt: "oberasbach", landkreis: "fuerth-land", einwohner: 18000, infrastrukturScore: "60", anbindungScore: "65", nahversorgungScore: "68", gruenScore: "65", gesamtScore: "65", quellenangabe: Q },
  { id: "ful-03", name: "Cadolzburg", stadt: "cadolzburg", landkreis: "fuerth-land", einwohner: 10500, infrastrukturScore: "45", anbindungScore: "40", nahversorgungScore: "52", gruenScore: "88", gesamtScore: "56", quellenangabe: Q },
  { id: "ful-04", name: "Langenzenn", stadt: "langenzenn", landkreis: "fuerth-land", einwohner: 10800, infrastrukturScore: "48", anbindungScore: "38", nahversorgungScore: "55", gruenScore: "85", gesamtScore: "57", quellenangabe: Q },
  { id: "ful-05", name: "Stein", stadt: "stein", landkreis: "fuerth-land", einwohner: 14500, infrastrukturScore: "58", anbindungScore: "60", nahversorgungScore: "65", gruenScore: "70", gesamtScore: "63", quellenangabe: Q },
  { id: "ful-06", name: "Roßtal", stadt: "rosstal", landkreis: "fuerth-land", einwohner: 10200, infrastrukturScore: "42", anbindungScore: "45", nahversorgungScore: "50", gruenScore: "88", gesamtScore: "56", quellenangabe: Q },
  { id: "ful-07", name: "Ammerndorf", stadt: "ammerndorf", landkreis: "fuerth-land", einwohner: 2400, infrastrukturScore: "28", anbindungScore: "25", nahversorgungScore: "32", gruenScore: "92", gesamtScore: "44", quellenangabe: Q },
  { id: "ful-08", name: "Großhabersdorf", stadt: "grosshabersdorf", landkreis: "fuerth-land", einwohner: 4500, infrastrukturScore: "30", anbindungScore: "22", nahversorgungScore: "35", gruenScore: "95", gesamtScore: "46", quellenangabe: Q },
  { id: "ful-09", name: "Wilhermsdorf", stadt: "wilhermsdorf", landkreis: "fuerth-land", einwohner: 5000, infrastrukturScore: "35", anbindungScore: "30", nahversorgungScore: "42", gruenScore: "90", gesamtScore: "49", quellenangabe: Q },

  // ──────────────────────────────────────────────────────────
  // 7. LK Nürnberger Land
  // ──────────────────────────────────────────────────────────
  { id: "nul-01", name: "Lauf a.d.Pegnitz", stadt: "lauf", landkreis: "nuernberger-land", einwohner: 27000, infrastrukturScore: "62", anbindungScore: "58", nahversorgungScore: "68", gruenScore: "75", gesamtScore: "66", quellenangabe: Q },
  { id: "nul-02", name: "Altdorf", stadt: "altdorf", landkreis: "nuernberger-land", einwohner: 15500, infrastrukturScore: "55", anbindungScore: "50", nahversorgungScore: "62", gruenScore: "78", gesamtScore: "61", quellenangabe: Q },
  { id: "nul-03", name: "Hersbruck", stadt: "hersbruck", landkreis: "nuernberger-land", einwohner: 12500, infrastrukturScore: "52", anbindungScore: "55", nahversorgungScore: "60", gruenScore: "82", gesamtScore: "62", quellenangabe: Q },
  { id: "nul-04", name: "Feucht", stadt: "feucht", landkreis: "nuernberger-land", einwohner: 13000, infrastrukturScore: "55", anbindungScore: "62", nahversorgungScore: "60", gruenScore: "75", gesamtScore: "63", quellenangabe: Q },
  { id: "nul-05", name: "Schwarzenbruck", stadt: "schwarzenbruck", landkreis: "nuernberger-land", einwohner: 8500, infrastrukturScore: "42", anbindungScore: "45", nahversorgungScore: "50", gruenScore: "88", gesamtScore: "56", quellenangabe: Q },
  { id: "nul-06", name: "Rückersdorf", stadt: "rueckersdorf", landkreis: "nuernberger-land", einwohner: 4200, infrastrukturScore: "35", anbindungScore: "38", nahversorgungScore: "40", gruenScore: "90", gesamtScore: "51", quellenangabe: Q },
  { id: "nul-07", name: "Schwaig", stadt: "schwaig", landkreis: "nuernberger-land", einwohner: 8000, infrastrukturScore: "48", anbindungScore: "52", nahversorgungScore: "55", gruenScore: "78", gesamtScore: "58", quellenangabe: Q },
  { id: "nul-08", name: "Happurg", stadt: "happurg", landkreis: "nuernberger-land", einwohner: 4000, infrastrukturScore: "28", anbindungScore: "25", nahversorgungScore: "32", gruenScore: "95", gesamtScore: "45", quellenangabe: Q },
  { id: "nul-09", name: "Ottensoos", stadt: "ottensoos", landkreis: "nuernberger-land", einwohner: 2800, infrastrukturScore: "30", anbindungScore: "32", nahversorgungScore: "35", gruenScore: "92", gesamtScore: "47", quellenangabe: Q },

  // ──────────────────────────────────────────────────────────
  // 8. LK Roth
  // ──────────────────────────────────────────────────────────
  { id: "ro-01", name: "Roth", stadt: "roth", landkreis: "roth", einwohner: 25500, infrastrukturScore: "60", anbindungScore: "55", nahversorgungScore: "65", gruenScore: "72", gesamtScore: "63", quellenangabe: Q },
  { id: "ro-02", name: "Wendelstein", stadt: "wendelstein", landkreis: "roth", einwohner: 16000, infrastrukturScore: "55", anbindungScore: "58", nahversorgungScore: "62", gruenScore: "75", gesamtScore: "63", quellenangabe: Q },
  { id: "ro-03", name: "Schwanstetten", stadt: "schwanstetten", landkreis: "roth", einwohner: 7800, infrastrukturScore: "40", anbindungScore: "38", nahversorgungScore: "45", gruenScore: "88", gesamtScore: "53", quellenangabe: Q },
  { id: "ro-04", name: "Hilpoltstein", stadt: "hilpoltstein", landkreis: "roth", einwohner: 13500, infrastrukturScore: "48", anbindungScore: "35", nahversorgungScore: "55", gruenScore: "85", gesamtScore: "56", quellenangabe: Q },
  { id: "ro-05", name: "Georgensgmünd", stadt: "georgensgmuend", landkreis: "roth", einwohner: 6500, infrastrukturScore: "35", anbindungScore: "32", nahversorgungScore: "42", gruenScore: "90", gesamtScore: "50", quellenangabe: Q },
  { id: "ro-06", name: "Büchenbach", stadt: "buechenbach-roth", landkreis: "roth", einwohner: 6200, infrastrukturScore: "32", anbindungScore: "28", nahversorgungScore: "38", gruenScore: "92", gesamtScore: "48", quellenangabe: Q },
  { id: "ro-07", name: "Rednitzhembach", stadt: "rednitzhembach", landkreis: "roth", einwohner: 7500, infrastrukturScore: "42", anbindungScore: "45", nahversorgungScore: "48", gruenScore: "82", gesamtScore: "54", quellenangabe: Q },
  { id: "ro-08", name: "Allersberg", stadt: "allersberg", landkreis: "roth", einwohner: 8200, infrastrukturScore: "45", anbindungScore: "42", nahversorgungScore: "52", gruenScore: "85", gesamtScore: "56", quellenangabe: Q },

  // ──────────────────────────────────────────────────────────
  // 9. LK Forchheim
  // ──────────────────────────────────────────────────────────
  { id: "fo-01", name: "Forchheim", stadt: "forchheim", landkreis: "forchheim", einwohner: 32000, infrastrukturScore: "65", anbindungScore: "62", nahversorgungScore: "70", gruenScore: "65", gesamtScore: "66", quellenangabe: Q },
  { id: "fo-02", name: "Ebermannstadt", stadt: "ebermannstadt", landkreis: "forchheim", einwohner: 6800, infrastrukturScore: "42", anbindungScore: "38", nahversorgungScore: "50", gruenScore: "92", gesamtScore: "56", quellenangabe: Q },
  { id: "fo-03", name: "Eggolsheim", stadt: "eggolsheim", landkreis: "forchheim", einwohner: 6500, infrastrukturScore: "38", anbindungScore: "42", nahversorgungScore: "45", gruenScore: "88", gesamtScore: "53", quellenangabe: Q },
  { id: "fo-04", name: "Neunkirchen a.Brand", stadt: "neunkirchen", landkreis: "forchheim", einwohner: 8500, infrastrukturScore: "45", anbindungScore: "48", nahversorgungScore: "52", gruenScore: "82", gesamtScore: "57", quellenangabe: Q },
  { id: "fo-05", name: "Wiesenthau", stadt: "wiesenthau", landkreis: "forchheim", einwohner: 2200, infrastrukturScore: "25", anbindungScore: "22", nahversorgungScore: "30", gruenScore: "95", gesamtScore: "43", quellenangabe: Q },
  { id: "fo-06", name: "Gößweinstein", stadt: "goessweinstein", landkreis: "forchheim", einwohner: 4000, infrastrukturScore: "30", anbindungScore: "25", nahversorgungScore: "38", gruenScore: "95", gesamtScore: "47", quellenangabe: Q },
  { id: "fo-07", name: "Hallerndorf", stadt: "hallerndorf", landkreis: "forchheim", einwohner: 3800, infrastrukturScore: "28", anbindungScore: "22", nahversorgungScore: "35", gruenScore: "92", gesamtScore: "44", quellenangabe: Q },

  // ──────────────────────────────────────────────────────────
  // 10. LK Neustadt a.d.Aisch-Bad Windsheim
  // ──────────────────────────────────────────────────────────
  { id: "nea-01", name: "Neustadt a.d.Aisch", stadt: "neustadt-aisch", landkreis: "neustadt-aisch", einwohner: 13000, infrastrukturScore: "52", anbindungScore: "45", nahversorgungScore: "60", gruenScore: "78", gesamtScore: "59", quellenangabe: Q },
  { id: "nea-02", name: "Bad Windsheim", stadt: "bad-windsheim", landkreis: "neustadt-aisch", einwohner: 12500, infrastrukturScore: "50", anbindungScore: "40", nahversorgungScore: "58", gruenScore: "80", gesamtScore: "57", quellenangabe: Q },
  { id: "nea-03", name: "Dietersheim", stadt: "dietersheim", landkreis: "neustadt-aisch", einwohner: 2200, infrastrukturScore: "25", anbindungScore: "20", nahversorgungScore: "30", gruenScore: "92", gesamtScore: "42", quellenangabe: Q },
  { id: "nea-04", name: "Scheinfeld", stadt: "scheinfeld", landkreis: "neustadt-aisch", einwohner: 4500, infrastrukturScore: "35", anbindungScore: "28", nahversorgungScore: "42", gruenScore: "88", gesamtScore: "48", quellenangabe: Q },

  // ──────────────────────────────────────────────────────────
  // 11. Stadt/LK Ansbach
  // ──────────────────────────────────────────────────────────
  { id: "an-01", name: "Ansbach", stadt: "ansbach", landkreis: "ansbach", einwohner: 42000, infrastrukturScore: "70", anbindungScore: "62", nahversorgungScore: "72", gruenScore: "60", gesamtScore: "66", quellenangabe: Q },
  { id: "an-02", name: "Lichtenau", stadt: "lichtenau", landkreis: "ansbach", einwohner: 3800, infrastrukturScore: "28", anbindungScore: "22", nahversorgungScore: "32", gruenScore: "92", gesamtScore: "44", quellenangabe: Q },
  { id: "an-03", name: "Heilsbronn", stadt: "heilsbronn", landkreis: "ansbach", einwohner: 9800, infrastrukturScore: "45", anbindungScore: "42", nahversorgungScore: "52", gruenScore: "82", gesamtScore: "55", quellenangabe: Q },

  // ──────────────────────────────────────────────────────────
  // 12. Stadt/LK Bamberg
  // ──────────────────────────────────────────────────────────
  { id: "ba-01", name: "Bamberg", stadt: "bamberg", landkreis: "bamberg", einwohner: 78000, infrastrukturScore: "85", anbindungScore: "80", nahversorgungScore: "88", gruenScore: "55", gesamtScore: "77", quellenangabe: Q },
  { id: "ba-02", name: "Hirschaid", stadt: "hirschaid", landkreis: "bamberg", einwohner: 12500, infrastrukturScore: "48", anbindungScore: "52", nahversorgungScore: "55", gruenScore: "80", gesamtScore: "59", quellenangabe: Q },
  { id: "ba-03", name: "Strullendorf", stadt: "strullendorf", landkreis: "bamberg", einwohner: 8000, infrastrukturScore: "40", anbindungScore: "45", nahversorgungScore: "48", gruenScore: "85", gesamtScore: "55", quellenangabe: Q },

  // ──────────────────────────────────────────────────────────
  // 13. LK Neumarkt i.d.OPf.
  // ──────────────────────────────────────────────────────────
  { id: "nm-01", name: "Neumarkt i.d.OPf.", stadt: "neumarkt", landkreis: "neumarkt", einwohner: 41000, infrastrukturScore: "65", anbindungScore: "58", nahversorgungScore: "70", gruenScore: "65", gesamtScore: "65", quellenangabe: Q },
  { id: "nm-02", name: "Freystadt", stadt: "freystadt", landkreis: "neumarkt", einwohner: 9200, infrastrukturScore: "35", anbindungScore: "28", nahversorgungScore: "42", gruenScore: "90", gesamtScore: "49", quellenangabe: Q },
  { id: "nm-03", name: "Berching", stadt: "berching", landkreis: "neumarkt", einwohner: 8800, infrastrukturScore: "32", anbindungScore: "25", nahversorgungScore: "40", gruenScore: "92", gesamtScore: "47", quellenangabe: Q },

  // ──────────────────────────────────────────────────────────
  // Additional districts to reach ~100 entries
  // ──────────────────────────────────────────────────────────

  // More Nürnberg
  { id: "nu-11", name: "Eibach", stadt: "nuernberg", landkreis: "stadt-nuernberg", einwohner: 12000, infrastrukturScore: "62", anbindungScore: "60", nahversorgungScore: "68", gruenScore: "82", gesamtScore: "68", quellenangabe: Q },
  { id: "nu-12", name: "Worzeldorf", stadt: "nuernberg", landkreis: "stadt-nuernberg", einwohner: 4500, infrastrukturScore: "45", anbindungScore: "42", nahversorgungScore: "50", gruenScore: "92", gesamtScore: "57", quellenangabe: Q },
  { id: "nu-13", name: "Gibitzenhof", stadt: "nuernberg", landkreis: "stadt-nuernberg", einwohner: 9500, infrastrukturScore: "78", anbindungScore: "80", nahversorgungScore: "82", gruenScore: "40", gesamtScore: "70", quellenangabe: Q },

  // More Fürth
  { id: "fu-09", name: "Hardhöhe", stadt: "fuerth", landkreis: "stadt-fuerth", einwohner: 9500, infrastrukturScore: "72", anbindungScore: "75", nahversorgungScore: "78", gruenScore: "60", gesamtScore: "71", quellenangabe: Q },
  { id: "fu-10", name: "Dambach", stadt: "fuerth", landkreis: "stadt-fuerth", einwohner: 7200, infrastrukturScore: "68", anbindungScore: "65", nahversorgungScore: "70", gruenScore: "75", gesamtScore: "70", quellenangabe: Q },

  // More Erlangen
  { id: "er-08", name: "Frauenaurach", stadt: "erlangen", landkreis: "stadt-erlangen", einwohner: 5100, infrastrukturScore: "55", anbindungScore: "52", nahversorgungScore: "58", gruenScore: "85", gesamtScore: "63", quellenangabe: Q },
  { id: "er-09", name: "Alterlangen", stadt: "erlangen", landkreis: "stadt-erlangen", einwohner: 7500, infrastrukturScore: "78", anbindungScore: "80", nahversorgungScore: "76", gruenScore: "65", gesamtScore: "75", quellenangabe: Q },
  { id: "er-10", name: "Kriegenbrunn", stadt: "erlangen", landkreis: "stadt-erlangen", einwohner: 2800, infrastrukturScore: "35", anbindungScore: "32", nahversorgungScore: "38", gruenScore: "92", gesamtScore: "49", quellenangabe: Q },

  // More Schwabach
  { id: "sw-04", name: "Limbach", stadt: "schwabach", landkreis: "stadt-schwabach", einwohner: 2100, infrastrukturScore: "30", anbindungScore: "28", nahversorgungScore: "35", gruenScore: "92", gesamtScore: "46", quellenangabe: Q },

  // More Nürnberger Land
  { id: "nul-10", name: "Burgthann", stadt: "burgthann", landkreis: "nuernberger-land", einwohner: 11500, infrastrukturScore: "40", anbindungScore: "42", nahversorgungScore: "48", gruenScore: "85", gesamtScore: "54", quellenangabe: Q },

  // More Roth
  { id: "ro-09", name: "Abenberg", stadt: "abenberg", landkreis: "roth", einwohner: 5500, infrastrukturScore: "32", anbindungScore: "28", nahversorgungScore: "40", gruenScore: "90", gesamtScore: "48", quellenangabe: Q },

  // More Forchheim
  { id: "fo-08", name: "Pretzfeld", stadt: "pretzfeld", landkreis: "forchheim", einwohner: 4200, infrastrukturScore: "30", anbindungScore: "25", nahversorgungScore: "35", gruenScore: "92", gesamtScore: "46", quellenangabe: Q },

  // More Neustadt a.d.Aisch
  { id: "nea-05", name: "Uffenheim", stadt: "uffenheim", landkreis: "neustadt-aisch", einwohner: 6500, infrastrukturScore: "38", anbindungScore: "30", nahversorgungScore: "45", gruenScore: "88", gesamtScore: "50", quellenangabe: Q },

  // More Ansbach
  { id: "an-04", name: "Herrieden", stadt: "herrieden", landkreis: "ansbach", einwohner: 8000, infrastrukturScore: "38", anbindungScore: "30", nahversorgungScore: "45", gruenScore: "88", gesamtScore: "50", quellenangabe: Q },

  // More Bamberg
  { id: "ba-04", name: "Hallstadt", stadt: "hallstadt", landkreis: "bamberg", einwohner: 8800, infrastrukturScore: "50", anbindungScore: "55", nahversorgungScore: "58", gruenScore: "72", gesamtScore: "59", quellenangabe: Q },

  // More Neumarkt
  { id: "nm-04", name: "Pyrbaum", stadt: "pyrbaum", landkreis: "neumarkt", einwohner: 5500, infrastrukturScore: "30", anbindungScore: "28", nahversorgungScore: "35", gruenScore: "92", gesamtScore: "46", quellenangabe: Q },
  { id: "nm-05", name: "Postbauer-Heng", stadt: "postbauer-heng", landkreis: "neumarkt", einwohner: 8500, infrastrukturScore: "40", anbindungScore: "38", nahversorgungScore: "48", gruenScore: "82", gesamtScore: "52", quellenangabe: Q },
];

export const LANDKREIS_LABELS: Record<string, string> = {
  "stadt-nuernberg": "Stadt Nürnberg",
  "stadt-fuerth": "Stadt Fürth",
  "stadt-erlangen": "Stadt Erlangen",
  "stadt-schwabach": "Stadt Schwabach",
  "erlangen-hoechstadt": "LK Erlangen-Höchstadt",
  "fuerth-land": "LK Fürth",
  "nuernberger-land": "LK Nürnberger Land",
  "roth": "LK Roth",
  "forchheim": "LK Forchheim",
  "neustadt-aisch": "LK Neustadt a.d.Aisch",
  "ansbach": "Stadt/LK Ansbach",
  "bamberg": "Stadt/LK Bamberg",
  "neumarkt": "LK Neumarkt i.d.OPf.",
};
