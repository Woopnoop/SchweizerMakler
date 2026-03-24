import { NextResponse, type NextRequest } from "next/server";
import { eq, and, desc, or, ilike } from "drizzle-orm";
import { db } from "@/lib/db";
import { interessenten } from "@/lib/db/schema";
import { getSession } from "@/lib/auth/session";
import { interessentCreateSchema } from "@/lib/validations/interessent";

// ---------------------------------------------------------------------------
// GET /api/interessenten  — List (with optional ?search=)
// ---------------------------------------------------------------------------

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Nicht authentifiziert" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search")?.trim();

    const conditions = [eq(interessenten.maklerId, session.sub)];

    if (search && search.length > 0) {
      const pattern = `%${search}%`;
      conditions.push(
        or(
          ilike(interessenten.vorname, pattern),
          ilike(interessenten.nachname, pattern),
          ilike(interessenten.email, pattern),
        )!,
      );
    }

    const rows = await db
      .select()
      .from(interessenten)
      .where(and(...conditions))
      .orderBy(desc(interessenten.createdAt));

    return NextResponse.json({ data: rows });
  } catch (error) {
    console.error("GET /api/interessenten error:", error);
    return NextResponse.json({ error: "Interner Serverfehler" }, { status: 500 });
  }
}

// ---------------------------------------------------------------------------
// POST /api/interessenten  — Create
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Nicht authentifiziert" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = interessentCreateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validierungsfehler", details: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const { dsgvoEinwilligung, email, telefon, notizen, ...rest } = parsed.data;

    if (!dsgvoEinwilligung) {
      return NextResponse.json(
        { error: "DSGVO-Einwilligung erforderlich" },
        { status: 400 },
      );
    }

    const [created] = await db
      .insert(interessenten)
      .values({
        maklerId: session.sub,
        ...rest,
        email: email || null,
        telefon: telefon || null,
        notizen: notizen || null,
        dsgvoEinwilligungAm: new Date(),
      })
      .returning();

    return NextResponse.json({ data: created }, { status: 201 });
  } catch (error) {
    console.error("POST /api/interessenten error:", error);
    return NextResponse.json({ error: "Interner Serverfehler" }, { status: 500 });
  }
}
