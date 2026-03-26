import { NextResponse, type NextRequest } from "next/server";
import { eq, and, gte, lte } from "drizzle-orm";
import { db } from "@/lib/db";
import { interessenten, objekte } from "@/lib/db/schema";
import { getSession } from "@/lib/auth/session";
import { Pool } from "pg";

type RouteContext = { params: Promise<{ id: string }> };

function getPool(): Pool {
  return new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });
}

// ---------------------------------------------------------------------------
// GET /api/interessenten/[id]/matching
// Returns objekte + leads matching the interessent's suchkriterien.
// ---------------------------------------------------------------------------

export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Nicht authentifiziert" }, { status: 401 });
    }

    const { id } = await context.params;

    // 1. Load the prospect
    const [prospect] = await db
      .select()
      .from(interessenten)
      .where(and(eq(interessenten.id, id), eq(interessenten.maklerId, session.sub)))
      .limit(1);

    if (!prospect) {
      return NextResponse.json({ error: "Interessent nicht gefunden" }, { status: 404 });
    }

    const criteria = prospect.suchkriterien;

    // 2. Match against Objekte
    const objekteMatches = await matchObjekte(session.sub, criteria);

    // 3. Match against Leads
    const leadMatches = await matchLeads(criteria);

    return NextResponse.json({
      data: objekteMatches,
      leads: leadMatches,
    });
  } catch (error) {
    console.error("GET /api/interessenten/[id]/matching error:", error);
    return NextResponse.json({ error: "Interner Serverfehler" }, { status: 500 });
  }
}

// ---------------------------------------------------------------------------
// Match Objekte
// ---------------------------------------------------------------------------

async function matchObjekte(maklerId: string, criteria: any) {
  const conditions = [
    eq(objekte.maklerId, maklerId),
    eq(objekte.status, "aktiv"),
  ];

  if (criteria?.minPreis !== undefined) {
    conditions.push(gte(objekte.preis, String(criteria.minPreis)));
  }
  if (criteria?.maxPreis !== undefined) {
    conditions.push(lte(objekte.preis, String(criteria.maxPreis)));
  }
  if (criteria?.minFlaeche !== undefined) {
    conditions.push(gte(objekte.wohnflaeche, String(criteria.minFlaeche)));
  }
  if (criteria?.zimmer !== undefined) {
    conditions.push(gte(objekte.zimmer, String(criteria.zimmer)));
  }

  const candidates = await db
    .select()
    .from(objekte)
    .where(and(...conditions));

  return candidates.map((prop) => {
    let score = 0;
    const reasons: string[] = [];
    const preis = prop.preis ? Number(prop.preis) : null;
    const flaeche = prop.wohnflaeche ? Number(prop.wohnflaeche) : null;
    const zimmer = prop.zimmer ? Number(prop.zimmer) : null;

    if (preis !== null && criteria) {
      const inMin = criteria.minPreis === undefined || preis >= criteria.minPreis;
      const inMax = criteria.maxPreis === undefined || preis <= criteria.maxPreis;
      if (inMin && inMax) { score += 30; reasons.push("Preis im Budget"); }
    }
    if (flaeche !== null && criteria?.minFlaeche !== undefined && flaeche >= criteria.minFlaeche) {
      score += 25; reasons.push("Wohnfläche passt");
    }
    if (zimmer !== null && criteria?.zimmer !== undefined && zimmer >= criteria.zimmer) {
      score += 20; reasons.push("Zimmeranzahl passt");
    }
    if (criteria?.stadtteile?.length > 0 && prop.stadt) {
      const stadtLower = prop.stadt.toLowerCase();
      if (criteria.stadtteile.some((s: string) => stadtLower.includes(s.toLowerCase()) || s.toLowerCase().includes(stadtLower))) {
        score += 25; reasons.push("Stadtteil passt");
      }
    }

    return { ...prop, matchScore: score, matchReasons: reasons, source: "objekt" as const };
  }).sort((a, b) => b.matchScore - a.matchScore);
}

// ---------------------------------------------------------------------------
// Match Leads
// ---------------------------------------------------------------------------

async function matchLeads(criteria: any) {
  const pool = getPool();
  try {
    const result = await pool.query("SELECT * FROM leads ORDER BY received_at DESC");
    const leads = result.rows;

    return leads.map((lead) => {
      let score = 0;
      const reasons: string[] = [];
      const preis = Number(lead.current_price);
      const flaeche = lead.area_sqm ? Number(lead.area_sqm) : null;
      const zimmer = lead.rooms ? Number(lead.rooms) : null;
      const location = lead.location || "";

      if (criteria && preis > 0) {
        const inMin = criteria.minPreis === undefined || preis >= criteria.minPreis;
        const inMax = criteria.maxPreis === undefined || preis <= criteria.maxPreis;
        if (inMin && inMax) { score += 30; reasons.push("Preis im Budget"); }
      }
      if (flaeche !== null && criteria?.minFlaeche !== undefined && flaeche >= criteria.minFlaeche) {
        score += 25; reasons.push("Wohnfläche passt");
      }
      if (zimmer !== null && criteria?.zimmer !== undefined && zimmer >= criteria.zimmer) {
        score += 20; reasons.push("Zimmeranzahl passt");
      }
      if (criteria?.stadtteile?.length > 0 && location) {
        const locLower = location.toLowerCase();
        if (criteria.stadtteile.some((s: string) => locLower.includes(s.toLowerCase()) || s.toLowerCase().includes(locLower))) {
          score += 25; reasons.push("Standort passt");
        }
      }

      // Nur Leads mit mindestens einem Match zurückgeben
      if (!criteria || score === 0) return null;

      return {
        id: lead.id,
        portal: lead.portal,
        title: lead.title,
        url: lead.url,
        location: lead.location,
        currentPrice: preis,
        areaSqm: flaeche,
        rooms: zimmer,
        listingType: lead.listing_type,
        matchScore: score,
        matchReasons: reasons,
        source: "lead" as const,
      };
    }).filter(Boolean).sort((a: any, b: any) => b.matchScore - a.matchScore);
  } catch (err) {
    console.error("Lead matching error:", err);
    return [];
  } finally {
    await pool.end();
  }
}
