import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { objekte } from "@/lib/db/schema";
import { getSession } from "@/lib/auth/session";
import { objektCreateSchema } from "@/lib/validations/objekt";
import { eq, and, desc, count, sql, ilike, or } from "drizzle-orm";

// ---------------------------------------------------------------------------
// GET  /api/objekte  — paginated list (current user only)
// ---------------------------------------------------------------------------

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });
  }

  const { searchParams } = request.nextUrl;
  const page = Math.max(1, Number(searchParams.get("page") ?? 1));
  const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit") ?? 20)));
  const offset = (page - 1) * limit;

  const statusFilter = searchParams.get("status");
  const listingTypeFilter = searchParams.get("listingType");
  const search = searchParams.get("search")?.trim();

  // Build WHERE conditions
  const conditions = [eq(objekte.maklerId, session.sub)];

  if (statusFilter) {
    conditions.push(eq(objekte.status, statusFilter));
  }
  if (listingTypeFilter) {
    conditions.push(eq(objekte.listingType, listingTypeFilter));
  }
  if (search) {
    conditions.push(
      or(
        ilike(objekte.titel, `%${search}%`),
        ilike(objekte.stadt, `%${search}%`),
      )!,
    );
  }

  const where = and(...conditions);

  const [items, totalResult] = await Promise.all([
    db
      .select()
      .from(objekte)
      .where(where)
      .orderBy(desc(objekte.createdAt))
      .limit(limit)
      .offset(offset),
    db
      .select({ total: count() })
      .from(objekte)
      .where(where),
  ]);

  const total = totalResult[0]?.total ?? 0;

  return NextResponse.json({
    data: items,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
}

// ---------------------------------------------------------------------------
// POST /api/objekte  — create a new property
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Ungültiger JSON-Body" }, { status: 400 });
  }

  const result = objektCreateSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json(
      { error: "Validierungsfehler", details: result.error.flatten().fieldErrors },
      { status: 422 },
    );
  }

  const data = result.data;

  // Clean optional numeric fields: empty strings → undefined
  const cleanNum = (v: unknown) =>
    v === "" || v === undefined || v === null ? undefined : String(v);

  const [created] = await db
    .insert(objekte)
    .values({
      maklerId: session.sub,
      titel: data.titel,
      beschreibung: data.beschreibung || null,
      adresse: data.adresse || null,
      plz: data.plz || null,
      stadt: data.stadt || null,
      preis: String(data.preis),
      listingType: data.listingType,
      wohnflaeche: cleanNum(data.wohnflaeche) ?? null,
      grundstueck: cleanNum(data.grundstueck) ?? null,
      zimmer: cleanNum(data.zimmer) ?? null,
      baujahr:
        data.baujahr !== "" && data.baujahr !== undefined
          ? Number(data.baujahr)
          : null,
      energieausweis: data.energieausweis ?? null,
      status: data.status,
    })
    .returning();

  return NextResponse.json({ data: created }, { status: 201 });
}
