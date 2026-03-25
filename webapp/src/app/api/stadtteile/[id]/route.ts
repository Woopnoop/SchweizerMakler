import { NextResponse, type NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { stadtteile } from "@/lib/db/schema";
import { SAMPLE_DISTRICTS } from "@/lib/data/stadtteile-sample";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    // Erst in DB suchen
    let district = null;

    try {
      const dbResults = await db
        .select()
        .from(stadtteile)
        .where(eq(stadtteile.id, id))
        .limit(1);

      if (dbResults.length > 0) {
        district = dbResults[0];
      }
    } catch {
      // DB-Fehler ignorieren, Fallback auf Beispieldaten
    }

    // Fallback auf Beispieldaten
    if (!district) {
      district = SAMPLE_DISTRICTS.find((d) => d.id === id) ?? null;
    }

    if (!district) {
      return NextResponse.json(
        { error: "Stadtteil nicht gefunden" },
        { status: 404 },
      );
    }

    return NextResponse.json({ data: district });
  } catch (error) {
    console.error("Stadtteil detail error:", error);
    return NextResponse.json(
      { error: "Interner Serverfehler" },
      { status: 500 },
    );
  }
}
