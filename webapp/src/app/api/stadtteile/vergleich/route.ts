import { NextResponse, type NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { stadtteile } from "@/lib/db/schema";
import { SAMPLE_DISTRICTS } from "@/lib/data/stadtteile-sample";

async function findDistrict(id: string) {
  // Erst in DB suchen
  try {
    const dbResults = await db
      .select()
      .from(stadtteile)
      .where(eq(stadtteile.id, id))
      .limit(1);

    if (dbResults.length > 0) {
      return dbResults[0];
    }
  } catch {
    // DB-Fehler ignorieren
  }

  // Fallback auf Beispieldaten
  return SAMPLE_DISTRICTS.find((d) => d.id === id) ?? null;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const idA = searchParams.get("a");
    const idB = searchParams.get("b");

    if (!idA || !idB) {
      return NextResponse.json(
        { error: "Parameter 'a' und 'b' (Stadtteil-IDs) sind erforderlich" },
        { status: 400 },
      );
    }

    const [districtA, districtB] = await Promise.all([
      findDistrict(idA),
      findDistrict(idB),
    ]);

    if (!districtA) {
      return NextResponse.json(
        { error: `Stadtteil mit ID "${idA}" nicht gefunden` },
        { status: 404 },
      );
    }

    if (!districtB) {
      return NextResponse.json(
        { error: `Stadtteil mit ID "${idB}" nicht gefunden` },
        { status: 404 },
      );
    }

    return NextResponse.json({
      vergleich: {
        a: districtA,
        b: districtB,
      },
    });
  } catch (error) {
    console.error("Stadtteil-Vergleich error:", error);
    return NextResponse.json(
      { error: "Interner Serverfehler" },
      { status: 500 },
    );
  }
}
