import { NextResponse, type NextRequest } from "next/server";
import { eq, and, gte, lte, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { interessenten, objekte } from "@/lib/db/schema";
import { getSession } from "@/lib/auth/session";

type RouteContext = { params: Promise<{ id: string }> };

// ---------------------------------------------------------------------------
// GET /api/interessenten/[id]/matching
// Returns objekte matching the interessent's suchkriterien, scored by relevance.
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
    if (!criteria) {
      // No search criteria — return all active properties
      const allProps = await db
        .select()
        .from(objekte)
        .where(and(eq(objekte.maklerId, session.sub), eq(objekte.status, "aktiv")));

      return NextResponse.json({
        data: allProps.map((p) => ({ ...p, matchScore: 0, matchReasons: [] })),
      });
    }

    // 2. Build WHERE conditions based on criteria
    const conditions = [
      eq(objekte.maklerId, session.sub),
      eq(objekte.status, "aktiv"),
    ];

    if (criteria.minPreis !== undefined) {
      conditions.push(gte(objekte.preis, String(criteria.minPreis)));
    }
    if (criteria.maxPreis !== undefined) {
      conditions.push(lte(objekte.preis, String(criteria.maxPreis)));
    }
    if (criteria.minFlaeche !== undefined) {
      conditions.push(gte(objekte.wohnflaeche, String(criteria.minFlaeche)));
    }
    if (criteria.zimmer !== undefined) {
      conditions.push(gte(objekte.zimmer, String(criteria.zimmer)));
    }

    // Fetch candidates (broad filter)
    const candidates = await db
      .select()
      .from(objekte)
      .where(and(...conditions));

    // 3. Score each candidate
    const scored = candidates.map((prop) => {
      let score = 0;
      const reasons: string[] = [];

      const preis = prop.preis ? Number(prop.preis) : null;
      const flaeche = prop.wohnflaeche ? Number(prop.wohnflaeche) : null;
      const zimmer = prop.zimmer ? Number(prop.zimmer) : null;

      // Price in range
      if (preis !== null) {
        const inMin = criteria.minPreis === undefined || preis >= criteria.minPreis;
        const inMax = criteria.maxPreis === undefined || preis <= criteria.maxPreis;
        if (inMin && inMax) {
          score += 30;
          reasons.push("Preis im Budget");
        }
      }

      // Area
      if (flaeche !== null && criteria.minFlaeche !== undefined) {
        if (flaeche >= criteria.minFlaeche) {
          score += 25;
          reasons.push("Wohnfläche passt");
        }
      }

      // Rooms
      if (zimmer !== null && criteria.zimmer !== undefined) {
        if (zimmer >= criteria.zimmer) {
          score += 20;
          reasons.push("Zimmeranzahl passt");
        }
      }

      // District
      if (
        criteria.stadtteile &&
        criteria.stadtteile.length > 0 &&
        prop.stadt
      ) {
        const stadtLower = prop.stadt.toLowerCase();
        const match = criteria.stadtteile.some(
          (s) => stadtLower.includes(s.toLowerCase()) || s.toLowerCase().includes(stadtLower),
        );
        if (match) {
          score += 25;
          reasons.push("Stadtteil passt");
        }
      }

      return { ...prop, matchScore: score, matchReasons: reasons };
    });

    // Sort by score descending
    scored.sort((a, b) => b.matchScore - a.matchScore);

    return NextResponse.json({ data: scored });
  } catch (error) {
    console.error("GET /api/interessenten/[id]/matching error:", error);
    return NextResponse.json({ error: "Interner Serverfehler" }, { status: 500 });
  }
}
