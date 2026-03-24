import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { objekte } from "@/lib/db/schema";
import { getSession } from "@/lib/auth/session";
import { objektUpdateSchema } from "@/lib/validations/objekt";
import { eq, and } from "drizzle-orm";

type RouteContext = { params: Promise<{ id: string }> };

// ---------------------------------------------------------------------------
// GET  /api/objekte/[id]  — single property (verify ownership)
// ---------------------------------------------------------------------------

export async function GET(_request: NextRequest, context: RouteContext) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });
  }

  const { id } = await context.params;

  const [item] = await db
    .select()
    .from(objekte)
    .where(and(eq(objekte.id, id), eq(objekte.maklerId, session.sub)));

  if (!item) {
    return NextResponse.json({ error: "Objekt nicht gefunden" }, { status: 404 });
  }

  return NextResponse.json({ data: item });
}

// ---------------------------------------------------------------------------
// PUT  /api/objekte/[id]  — update property (verify ownership)
// ---------------------------------------------------------------------------

export async function PUT(request: NextRequest, context: RouteContext) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });
  }

  const { id } = await context.params;

  // Verify ownership
  const [existing] = await db
    .select({ id: objekte.id })
    .from(objekte)
    .where(and(eq(objekte.id, id), eq(objekte.maklerId, session.sub)));

  if (!existing) {
    return NextResponse.json({ error: "Objekt nicht gefunden" }, { status: 404 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Ungültiger JSON-Body" }, { status: 400 });
  }

  const result = objektUpdateSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json(
      { error: "Validierungsfehler", details: result.error.flatten().fieldErrors },
      { status: 422 },
    );
  }

  const data = result.data;

  const cleanNum = (v: unknown) =>
    v === "" || v === undefined || v === null ? undefined : String(v);

  // Build update payload (only provided fields)
  const updatePayload: Record<string, unknown> = { updatedAt: new Date() };

  if (data.titel !== undefined) updatePayload.titel = data.titel;
  if (data.beschreibung !== undefined)
    updatePayload.beschreibung = data.beschreibung || null;
  if (data.adresse !== undefined) updatePayload.adresse = data.adresse || null;
  if (data.plz !== undefined) updatePayload.plz = data.plz || null;
  if (data.stadt !== undefined) updatePayload.stadt = data.stadt || null;
  if (data.preis !== undefined) updatePayload.preis = String(data.preis);
  if (data.listingType !== undefined) updatePayload.listingType = data.listingType;
  if (data.wohnflaeche !== undefined)
    updatePayload.wohnflaeche = cleanNum(data.wohnflaeche) ?? null;
  if (data.grundstueck !== undefined)
    updatePayload.grundstueck = cleanNum(data.grundstueck) ?? null;
  if (data.zimmer !== undefined)
    updatePayload.zimmer = cleanNum(data.zimmer) ?? null;
  if (data.baujahr !== undefined)
    updatePayload.baujahr =
      data.baujahr !== "" && data.baujahr !== undefined
        ? Number(data.baujahr)
        : null;
  if (data.energieausweis !== undefined)
    updatePayload.energieausweis = data.energieausweis ?? null;
  if (data.status !== undefined) updatePayload.status = data.status;

  const [updated] = await db
    .update(objekte)
    .set(updatePayload)
    .where(and(eq(objekte.id, id), eq(objekte.maklerId, session.sub)))
    .returning();

  return NextResponse.json({ data: updated });
}

// ---------------------------------------------------------------------------
// DELETE /api/objekte/[id]  — delete property (verify ownership)
// ---------------------------------------------------------------------------

export async function DELETE(_request: NextRequest, context: RouteContext) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });
  }

  const { id } = await context.params;

  const [deleted] = await db
    .delete(objekte)
    .where(and(eq(objekte.id, id), eq(objekte.maklerId, session.sub)))
    .returning({ id: objekte.id });

  if (!deleted) {
    return NextResponse.json({ error: "Objekt nicht gefunden" }, { status: 404 });
  }

  return NextResponse.json({ message: "Objekt gelöscht" });
}
