import { NextResponse, type NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { stadtteile } from "@/lib/db/schema";
import { SAMPLE_DISTRICTS } from "@/lib/data/stadtteile-sample";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const stadtFilter = searchParams.get("stadt");
    const landkreisFilter = searchParams.get("landkreis");
    const searchFilter = searchParams.get("search");

    // Daten aus der Datenbank laden
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let dbResults: any[] = [];

    try {
      if (stadtFilter) {
        dbResults = await db
          .select()
          .from(stadtteile)
          .where(eq(stadtteile.stadt, stadtFilter));
      } else {
        dbResults = await db.select().from(stadtteile);
      }
    } catch {
      // DB-Fehler ignorieren, Fallback auf Beispieldaten
      dbResults = [];
    }

    // Fallback: Wenn DB leer ist, Beispieldaten verwenden
    if (dbResults.length === 0) {
      let data = [...SAMPLE_DISTRICTS];

      if (stadtFilter) {
        data = data.filter((d) => d.stadt === stadtFilter);
      }

      if (landkreisFilter) {
        data = data.filter((d) => d.landkreis === landkreisFilter);
      }

      if (searchFilter) {
        const term = searchFilter.toLowerCase();
        data = data.filter(
          (d) =>
            d.name.toLowerCase().includes(term) ||
            d.stadt.toLowerCase().includes(term),
        );
      }

      return NextResponse.json({
        data,
        hinweis: "Beispieldaten — keine Daten in der Datenbank vorhanden",
      });
    }

    // Wenn DB-Daten vorhanden, optional filtern
    let result = dbResults;

    if (landkreisFilter) {
      result = result.filter(
        (d: { landkreis?: string }) => d.landkreis === landkreisFilter,
      );
    }

    if (searchFilter) {
      const term = searchFilter.toLowerCase();
      result = result.filter(
        (d: { name: string; stadt: string }) =>
          d.name.toLowerCase().includes(term) ||
          d.stadt.toLowerCase().includes(term),
      );
    }

    return NextResponse.json({ data: result });
  } catch (error) {
    console.error("Stadtteile GET error:", error);
    return NextResponse.json(
      { error: "Interner Serverfehler" },
      { status: 500 },
    );
  }
}
