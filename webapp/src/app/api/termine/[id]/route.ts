import { NextResponse, type NextRequest } from "next/server";
import { eq, and } from "drizzle-orm";
import { db } from "@/lib/db";
import { termine } from "@/lib/db/schema";
import { getSession } from "@/lib/auth/session";
import { terminUpdateSchema } from "@/lib/validations/termin";

type RouteContext = { params: Promise<{ id: string }> };

// ---------------------------------------------------------------------------
// PUT /api/termine/[id]  — Update status, notes, etc.
// ---------------------------------------------------------------------------

export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Nicht authentifiziert" }, { status: 401 });
    }

    const { id } = await context.params;
    const body = await request.json();
    const parsed = terminUpdateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validierungsfehler", details: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const updateData: Record<string, unknown> = {};
    const data = parsed.data;

    if (data.terminDatum !== undefined) updateData.terminDatum = new Date(data.terminDatum);
    if (data.objektId !== undefined) updateData.objektId = data.objektId ?? null;
    if (data.interessentId !== undefined) updateData.interessentId = data.interessentId ?? null;
    if (data.notizen !== undefined) updateData.notizen = data.notizen || null;
    if (data.status !== undefined) updateData.status = data.status;

    const [updated] = await db
      .update(termine)
      .set(updateData)
      .where(and(eq(termine.id, id), eq(termine.maklerId, session.sub)))
      .returning();

    if (!updated) {
      return NextResponse.json({ error: "Termin nicht gefunden" }, { status: 404 });
    }

    return NextResponse.json({ data: updated });
  } catch (error) {
    console.error("PUT /api/termine/[id] error:", error);
    return NextResponse.json({ error: "Interner Serverfehler" }, { status: 500 });
  }
}

// ---------------------------------------------------------------------------
// DELETE /api/termine/[id]
// ---------------------------------------------------------------------------

export async function DELETE(_request: NextRequest, context: RouteContext) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Nicht authentifiziert" }, { status: 401 });
    }

    const { id } = await context.params;

    const [deleted] = await db
      .delete(termine)
      .where(and(eq(termine.id, id), eq(termine.maklerId, session.sub)))
      .returning({ id: termine.id });

    if (!deleted) {
      return NextResponse.json({ error: "Termin nicht gefunden" }, { status: 404 });
    }

    return NextResponse.json({ message: "Termin gelöscht" });
  } catch (error) {
    console.error("DELETE /api/termine/[id] error:", error);
    return NextResponse.json({ error: "Interner Serverfehler" }, { status: 500 });
  }
}
