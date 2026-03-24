import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { objekte, makler } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { hasFeature } from "@/lib/auth/tiers";
import { generateExposeHtml } from "@/lib/expose/html-template";
import { z } from "zod";

const schema = z.object({
  objektId: z.string().uuid(),
});

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Nicht authentifiziert" }, { status: 401 });
  }

  if (!hasFeature(session.tier, "expose_generator")) {
    return NextResponse.json(
      { error: "Exposé-Generator erfordert den Pro-Plan" },
      { status: 403 }
    );
  }

  const body = await request.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Ungültige Objekt-ID" }, { status: 400 });
  }

  // Objekt und Makler laden
  const [objekt] = await db
    .select()
    .from(objekte)
    .where(and(eq(objekte.id, parsed.data.objektId), eq(objekte.maklerId, session.sub)));

  if (!objekt) {
    return NextResponse.json({ error: "Objekt nicht gefunden" }, { status: 404 });
  }

  const [maklerData] = await db
    .select()
    .from(makler)
    .where(eq(makler.id, session.sub));

  if (!maklerData) {
    return NextResponse.json({ error: "Makler nicht gefunden" }, { status: 404 });
  }

  // HTML generieren
  const html = generateExposeHtml({
    titel: objekt.titel,
    beschreibung: objekt.beschreibung ?? undefined,
    adresse: objekt.adresse ?? undefined,
    plz: objekt.plz ?? undefined,
    stadt: objekt.stadt ?? undefined,
    preis: objekt.preis
      ? Number(objekt.preis).toLocaleString("de-DE", { style: "currency", currency: "EUR", minimumFractionDigits: 0 })
      : undefined,
    listingType: objekt.listingType,
    wohnflaeche: objekt.wohnflaeche ?? undefined,
    grundstueck: objekt.grundstueck ?? undefined,
    zimmer: objekt.zimmer ?? undefined,
    baujahr: objekt.baujahr ?? undefined,
    status: objekt.status,
    energieausweis: objekt.energieausweis as any,
    maklerName: maklerData.displayName,
    maklerCompany: maklerData.companyName ?? undefined,
    maklerPhone: maklerData.phone ?? undefined,
    maklerEmail: maklerData.email,
    maklerLogo: maklerData.logoUrl ?? undefined,
  });

  // HTML als Download zurückgeben
  return new NextResponse(html, {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Content-Disposition": `attachment; filename="Expose-${encodeURIComponent(objekt.titel.substring(0, 50))}.html"`,
    },
  });
}
