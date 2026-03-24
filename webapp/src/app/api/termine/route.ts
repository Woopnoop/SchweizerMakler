import { NextResponse, type NextRequest } from "next/server";
import { eq, and, desc, gte, lte } from "drizzle-orm";
import { db } from "@/lib/db";
import { termine, objekte, interessenten } from "@/lib/db/schema";
import { getSession } from "@/lib/auth/session";
import { terminCreateSchema } from "@/lib/validations/termin";

// ---------------------------------------------------------------------------
// GET /api/termine  — List (filter by ?status=, ?from=, ?to=)
// ---------------------------------------------------------------------------

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Nicht authentifiziert" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const from = searchParams.get("from");
    const to = searchParams.get("to");

    const conditions = [eq(termine.maklerId, session.sub)];

    if (status) {
      conditions.push(eq(termine.status, status));
    }
    if (from) {
      conditions.push(gte(termine.terminDatum, new Date(from)));
    }
    if (to) {
      conditions.push(lte(termine.terminDatum, new Date(to)));
    }

    const rows = await db
      .select({
        id: termine.id,
        maklerId: termine.maklerId,
        objektId: termine.objektId,
        interessentId: termine.interessentId,
        terminDatum: termine.terminDatum,
        notizen: termine.notizen,
        status: termine.status,
        createdAt: termine.createdAt,
        objektTitel: objekte.titel,
        interessentVorname: interessenten.vorname,
        interessentNachname: interessenten.nachname,
      })
      .from(termine)
      .leftJoin(objekte, eq(termine.objektId, objekte.id))
      .leftJoin(interessenten, eq(termine.interessentId, interessenten.id))
      .where(and(...conditions))
      .orderBy(desc(termine.terminDatum));

    return NextResponse.json({ data: rows });
  } catch (error) {
    console.error("GET /api/termine error:", error);
    return NextResponse.json({ error: "Interner Serverfehler" }, { status: 500 });
  }
}

// ---------------------------------------------------------------------------
// POST /api/termine  — Create
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Nicht authentifiziert" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = terminCreateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validierungsfehler", details: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const { terminDatum, objektId, interessentId, notizen, status } = parsed.data;

    const [created] = await db
      .insert(termine)
      .values({
        maklerId: session.sub,
        terminDatum: new Date(terminDatum),
        objektId: objektId ?? null,
        interessentId: interessentId ?? null,
        notizen: notizen || null,
        status,
      })
      .returning();

    return NextResponse.json({ data: created }, { status: 201 });
  } catch (error) {
    console.error("POST /api/termine error:", error);
    return NextResponse.json({ error: "Interner Serverfehler" }, { status: 500 });
  }
}
