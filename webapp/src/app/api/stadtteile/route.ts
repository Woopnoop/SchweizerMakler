import { NextResponse, type NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { stadtteile } from "@/lib/db/schema";

// ============================================================
// Hardcoded Beispieldaten (Fallback falls DB leer)
// ============================================================

const SAMPLE_DISTRICTS = [
  // Erlangen
  { id: "er-01", name: "Innenstadt", stadt: "erlangen", einwohner: 8500, infrastrukturScore: "92", anbindungScore: "95", nahversorgungScore: "96", gruenScore: "55", gesamtScore: "85", quellenangabe: "Beispieldaten — OpenStreetMap contributors (ODbL)" },
  { id: "er-02", name: "Röthelheimpark", stadt: "erlangen", einwohner: 6200, infrastrukturScore: "88", anbindungScore: "82", nahversorgungScore: "85", gruenScore: "78", gesamtScore: "83", quellenangabe: "Beispieldaten — OpenStreetMap contributors (ODbL)" },
  { id: "er-03", name: "Büchenbach", stadt: "erlangen", einwohner: 11000, infrastrukturScore: "75", anbindungScore: "72", nahversorgungScore: "80", gruenScore: "70", gesamtScore: "74", quellenangabe: "Beispieldaten — OpenStreetMap contributors (ODbL)" },
  { id: "er-04", name: "Tennenlohe", stadt: "erlangen", einwohner: 5800, infrastrukturScore: "65", anbindungScore: "60", nahversorgungScore: "62", gruenScore: "88", gesamtScore: "69", quellenangabe: "Beispieldaten — OpenStreetMap contributors (ODbL)" },
  { id: "er-05", name: "Bruck", stadt: "erlangen", einwohner: 9200, infrastrukturScore: "80", anbindungScore: "85", nahversorgungScore: "82", gruenScore: "65", gesamtScore: "78", quellenangabe: "Beispieldaten — OpenStreetMap contributors (ODbL)" },
  { id: "er-06", name: "Sieglitzhof", stadt: "erlangen", einwohner: 4800, infrastrukturScore: "82", anbindungScore: "78", nahversorgungScore: "75", gruenScore: "72", gesamtScore: "77", quellenangabe: "Beispieldaten — OpenStreetMap contributors (ODbL)" },
  { id: "er-07", name: "Alterlangen", stadt: "erlangen", einwohner: 7500, infrastrukturScore: "78", anbindungScore: "80", nahversorgungScore: "76", gruenScore: "68", gesamtScore: "76", quellenangabe: "Beispieldaten — OpenStreetMap contributors (ODbL)" },
  { id: "er-08", name: "Frauenaurach", stadt: "erlangen", einwohner: 5100, infrastrukturScore: "58", anbindungScore: "55", nahversorgungScore: "60", gruenScore: "85", gesamtScore: "65", quellenangabe: "Beispieldaten — OpenStreetMap contributors (ODbL)" },

  // Fürth
  { id: "fu-01", name: "Innenstadt", stadt: "fuerth", einwohner: 12000, infrastrukturScore: "90", anbindungScore: "92", nahversorgungScore: "94", gruenScore: "50", gesamtScore: "82", quellenangabe: "Beispieldaten — OpenStreetMap contributors (ODbL)" },
  { id: "fu-02", name: "Südstadt", stadt: "fuerth", einwohner: 15000, infrastrukturScore: "82", anbindungScore: "88", nahversorgungScore: "85", gruenScore: "55", gesamtScore: "78", quellenangabe: "Beispieldaten — OpenStreetMap contributors (ODbL)" },
  { id: "fu-03", name: "Hardhöhe", stadt: "fuerth", einwohner: 9500, infrastrukturScore: "72", anbindungScore: "75", nahversorgungScore: "78", gruenScore: "62", gesamtScore: "72", quellenangabe: "Beispieldaten — OpenStreetMap contributors (ODbL)" },
  { id: "fu-04", name: "Poppenreuth", stadt: "fuerth", einwohner: 5800, infrastrukturScore: "60", anbindungScore: "58", nahversorgungScore: "55", gruenScore: "82", gesamtScore: "64", quellenangabe: "Beispieldaten — OpenStreetMap contributors (ODbL)" },
  { id: "fu-05", name: "Dambach", stadt: "fuerth", einwohner: 7200, infrastrukturScore: "68", anbindungScore: "65", nahversorgungScore: "70", gruenScore: "75", gesamtScore: "70", quellenangabe: "Beispieldaten — OpenStreetMap contributors (ODbL)" },
  { id: "fu-06", name: "Stadeln", stadt: "fuerth", einwohner: 6100, infrastrukturScore: "55", anbindungScore: "52", nahversorgungScore: "58", gruenScore: "88", gesamtScore: "63", quellenangabe: "Beispieldaten — OpenStreetMap contributors (ODbL)" },
  { id: "fu-07", name: "Ronhof", stadt: "fuerth", einwohner: 4200, infrastrukturScore: "62", anbindungScore: "70", nahversorgungScore: "65", gruenScore: "72", gesamtScore: "67", quellenangabe: "Beispieldaten — OpenStreetMap contributors (ODbL)" },
  { id: "fu-08", name: "Eigenes Heim", stadt: "fuerth", einwohner: 6800, infrastrukturScore: "75", anbindungScore: "78", nahversorgungScore: "72", gruenScore: "68", gesamtScore: "73", quellenangabe: "Beispieldaten — OpenStreetMap contributors (ODbL)" },

  // Nürnberg
  { id: "nu-01", name: "Altstadt / St. Sebald", stadt: "nuernberg", einwohner: 6500, infrastrukturScore: "95", anbindungScore: "98", nahversorgungScore: "95", gruenScore: "40", gesamtScore: "82", quellenangabe: "Beispieldaten — OpenStreetMap contributors (ODbL)" },
  { id: "nu-02", name: "St. Johannis", stadt: "nuernberg", einwohner: 14000, infrastrukturScore: "90", anbindungScore: "92", nahversorgungScore: "90", gruenScore: "58", gesamtScore: "83", quellenangabe: "Beispieldaten — OpenStreetMap contributors (ODbL)" },
  { id: "nu-03", name: "Gostenhof", stadt: "nuernberg", einwohner: 11500, infrastrukturScore: "85", anbindungScore: "88", nahversorgungScore: "88", gruenScore: "45", gesamtScore: "77", quellenangabe: "Beispieldaten — OpenStreetMap contributors (ODbL)" },
  { id: "nu-04", name: "Maxfeld", stadt: "nuernberg", einwohner: 8200, infrastrukturScore: "88", anbindungScore: "90", nahversorgungScore: "85", gruenScore: "52", gesamtScore: "79", quellenangabe: "Beispieldaten — OpenStreetMap contributors (ODbL)" },
  { id: "nu-05", name: "Ziegelstein", stadt: "nuernberg", einwohner: 7500, infrastrukturScore: "68", anbindungScore: "72", nahversorgungScore: "70", gruenScore: "78", gesamtScore: "72", quellenangabe: "Beispieldaten — OpenStreetMap contributors (ODbL)" },
  { id: "nu-06", name: "Langwasser", stadt: "nuernberg", einwohner: 22000, infrastrukturScore: "75", anbindungScore: "82", nahversorgungScore: "80", gruenScore: "72", gesamtScore: "77", quellenangabe: "Beispieldaten — OpenStreetMap contributors (ODbL)" },
  { id: "nu-07", name: "Mögeldorf", stadt: "nuernberg", einwohner: 9800, infrastrukturScore: "72", anbindungScore: "70", nahversorgungScore: "74", gruenScore: "80", gesamtScore: "74", quellenangabe: "Beispieldaten — OpenStreetMap contributors (ODbL)" },
  { id: "nu-08", name: "Thon", stadt: "nuernberg", einwohner: 6800, infrastrukturScore: "65", anbindungScore: "68", nahversorgungScore: "65", gruenScore: "75", gesamtScore: "68", quellenangabe: "Beispieldaten — OpenStreetMap contributors (ODbL)" },
  { id: "nu-09", name: "Eibach", stadt: "nuernberg", einwohner: 12000, infrastrukturScore: "62", anbindungScore: "60", nahversorgungScore: "68", gruenScore: "82", gesamtScore: "68", quellenangabe: "Beispieldaten — OpenStreetMap contributors (ODbL)" },
  { id: "nu-10", name: "Worzeldorf", stadt: "nuernberg", einwohner: 4500, infrastrukturScore: "45", anbindungScore: "42", nahversorgungScore: "50", gruenScore: "92", gesamtScore: "57", quellenangabe: "Beispieldaten — OpenStreetMap contributors (ODbL)" },
];

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const stadtFilter = searchParams.get("stadt");

    // Daten aus der Datenbank laden
    let dbResults: typeof SAMPLE_DISTRICTS = [];

    try {
      if (stadtFilter) {
        dbResults = (await db
          .select()
          .from(stadtteile)
          .where(eq(stadtteile.stadt, stadtFilter))) as typeof SAMPLE_DISTRICTS;
      } else {
        dbResults = (await db.select().from(stadtteile)) as typeof SAMPLE_DISTRICTS;
      }
    } catch {
      // DB-Fehler ignorieren, Fallback auf Beispieldaten
      dbResults = [];
    }

    // Fallback: Wenn DB leer ist, Beispieldaten verwenden
    if (dbResults.length === 0) {
      const data = stadtFilter
        ? SAMPLE_DISTRICTS.filter((d) => d.stadt === stadtFilter)
        : SAMPLE_DISTRICTS;

      return NextResponse.json({
        data,
        hinweis: "Beispieldaten — keine Daten in der Datenbank vorhanden",
      });
    }

    return NextResponse.json({ data: dbResults });
  } catch (error) {
    console.error("Stadtteile GET error:", error);
    return NextResponse.json(
      { error: "Interner Serverfehler" },
      { status: 500 },
    );
  }
}
