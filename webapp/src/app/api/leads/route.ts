import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { Pool } from "pg";

const leadSchema = z.object({
  id: z.string().min(1),
  portal: z.string().min(1),
  url: z.string().url(),
  title: z.string().min(1),
  location: z.string().default(""),
  currentPrice: z.number().positive(),
  listingType: z.enum(["miete", "kauf"]).default("kauf"),
  areaSqm: z.number().positive().optional(),
  rooms: z.number().positive().optional(),
  standortScore: z.number().min(0).max(100).optional(),
  priceHistory: z
    .array(z.object({ timestamp: z.number(), price: z.number() }))
    .default([]),
});

function getPool(): Pool {
  return new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });
}

export async function GET(request: NextRequest) {
  const search = request.nextUrl.searchParams.get("search")?.toLowerCase();
  const pool = getPool();

  try {
    let query = "SELECT * FROM leads ORDER BY received_at DESC";
    const params: string[] = [];

    if (search) {
      query = "SELECT * FROM leads WHERE LOWER(title) LIKE $1 OR LOWER(location) LIKE $1 OR LOWER(portal) LIKE $1 ORDER BY received_at DESC";
      params.push(`%${search}%`);
    }

    const result = await pool.query(query, params);
    const leads = result.rows.map(row => ({
      id: row.id,
      portal: row.portal,
      url: row.url,
      title: row.title,
      location: row.location,
      currentPrice: Number(row.current_price),
      listingType: row.listing_type,
      areaSqm: row.area_sqm ? Number(row.area_sqm) : undefined,
      rooms: row.rooms ? Number(row.rooms) : undefined,
      standortScore: row.standort_score ? Number(row.standort_score) : undefined,
      priceHistory: row.price_history ?? [],
      receivedAt: new Date(row.received_at).getTime(),
      notizen: row.notizen ?? "",
    }));

    return NextResponse.json(leads);
  } catch (err) {
    console.error("Leads GET error:", err);
    return NextResponse.json([], { status: 200 });
  } finally {
    await pool.end();
  }
}

export async function POST(request: NextRequest) {
  const pool = getPool();

  try {
    const body = await request.json();
    const parsed = leadSchema.parse(body);

    await pool.query(
      `INSERT INTO leads (id, portal, url, title, location, current_price, listing_type, area_sqm, rooms, standort_score, price_history, received_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW())
       ON CONFLICT (id) DO UPDATE SET
         current_price = $6,
         price_history = $11,
         received_at = NOW()`,
      [
        parsed.id,
        parsed.portal,
        parsed.url,
        parsed.title,
        parsed.location,
        parsed.currentPrice,
        parsed.listingType,
        parsed.areaSqm ?? null,
        parsed.rooms ?? null,
        parsed.standortScore ?? null,
        JSON.stringify(parsed.priceHistory),
      ]
    );

    return NextResponse.json({ id: parsed.id, success: true }, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation failed", details: err.errors }, { status: 400 });
    }
    console.error("Leads POST error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  } finally {
    await pool.end();
  }
}

export async function DELETE(request: NextRequest) {
  const id = request.nextUrl.searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  const pool = getPool();
  try {
    const result = await pool.query("DELETE FROM leads WHERE id = $1", [id]);
    if (result.rowCount === 0) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Leads DELETE error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  } finally {
    await pool.end();
  }
}

export async function PATCH(request: NextRequest) {
  const pool = getPool();
  try {
    const body = await request.json();
    const { id, notizen } = body;
    if (!id) {
      return NextResponse.json({ error: "Missing id" }, { status: 400 });
    }
    await pool.query("UPDATE leads SET notizen = $1 WHERE id = $2", [notizen ?? "", id]);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Leads PATCH error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  } finally {
    await pool.end();
  }
}
