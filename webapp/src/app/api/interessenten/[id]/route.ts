import { NextResponse, type NextRequest } from "next/server";
import { eq, and } from "drizzle-orm";
import { db } from "@/lib/db";
import { interessenten } from "@/lib/db/schema";
import { getSession } from "@/lib/auth/session";
import { interessentUpdateSchema } from "@/lib/validations/interessent";

type RouteContext = { params: Promise<{ id: string }> };

// ---------------------------------------------------------------------------
// GET /api/interessenten/[id]
// ---------------------------------------------------------------------------

export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Nicht authentifiziert" }, { status: 401 });
    }

    const { id } = await context.params;

    const [row] = await db
      .select()
      .from(interessenten)
      .where(and(eq(interessenten.id, id), eq(interessenten.maklerId, session.sub)))
      .limit(1);

    if (!row) {
      return NextResponse.json({ error: "Interessent nicht gefunden" }, { status: 404 });
    }

    return NextResponse.json({ data: row });
  } catch (error) {
    console.error("GET /api/interessenten/[id] error:", error);
    return NextResponse.json({ error: "Interner Serverfehler" }, { status: 500 });
  }
}

// ---------------------------------------------------------------------------
// PUT /api/interessenten/[id]
// ---------------------------------------------------------------------------

export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Nicht authentifiziert" }, { status: 401 });
    }

    const { id } = await context.params;
    const body = await request.json();
    const parsed = interessentUpdateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validierungsfehler", details: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    // Build update payload — only set fields that were provided
    const updateData: Record<string, unknown> = {};
    const data = parsed.data;

    if (data.vorname !== undefined) updateData.vorname = data.vorname;
    if (data.nachname !== undefined) updateData.nachname = data.nachname;
    if (data.email !== undefined) updateData.email = data.email || null;
    if (data.telefon !== undefined) updateData.telefon = data.telefon || null;
    if (data.notizen !== undefined) updateData.notizen = data.notizen || null;
    if (data.suchkriterien !== undefined) updateData.suchkriterien = data.suchkriterien;

    const [updated] = await db
      .update(interessenten)
      .set(updateData)
      .where(and(eq(interessenten.id, id), eq(interessenten.maklerId, session.sub)))
      .returning();

    if (!updated) {
      return NextResponse.json({ error: "Interessent nicht gefunden" }, { status: 404 });
    }

    return NextResponse.json({ data: updated });
  } catch (error) {
    console.error("PUT /api/interessenten/[id] error:", error);
    return NextResponse.json({ error: "Interner Serverfehler" }, { status: 500 });
  }
}

// ---------------------------------------------------------------------------
// DELETE /api/interessenten/[id]  — DSGVO: Einwilligung widerrufen = löschen
// ---------------------------------------------------------------------------

export async function DELETE(_request: NextRequest, context: RouteContext) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Nicht authentifiziert" }, { status: 401 });
    }

    const { id } = await context.params;

    const [deleted] = await db
      .delete(interessenten)
      .where(and(eq(interessenten.id, id), eq(interessenten.maklerId, session.sub)))
      .returning({ id: interessenten.id });

    if (!deleted) {
      return NextResponse.json({ error: "Interessent nicht gefunden" }, { status: 404 });
    }

    return NextResponse.json({ message: "Interessent und zugehörige Daten gelöscht" });
  } catch (error) {
    console.error("DELETE /api/interessenten/[id] error:", error);
    return NextResponse.json({ error: "Interner Serverfehler" }, { status: 500 });
  }
}
