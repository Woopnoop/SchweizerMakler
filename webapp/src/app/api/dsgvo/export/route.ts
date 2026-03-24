import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { makler, objekte, interessenten, termine } from "@/lib/db/schema";
import { getSession } from "@/lib/auth/session";

export async function GET() {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json(
        { error: "Nicht authentifiziert" },
        { status: 401 },
      );
    }

    const userId = session.sub;

    // Query all user data in parallel
    const [maklerData, objekteData, interessentenData, termineData] =
      await Promise.all([
        db
          .select({
            id: makler.id,
            email: makler.email,
            displayName: makler.displayName,
            companyName: makler.companyName,
            phone: makler.phone,
            subscriptionTier: makler.subscriptionTier,
            createdAt: makler.createdAt,
            updatedAt: makler.updatedAt,
          })
          .from(makler)
          .where(eq(makler.id, userId)),
        db
          .select()
          .from(objekte)
          .where(eq(objekte.maklerId, userId)),
        db
          .select()
          .from(interessenten)
          .where(eq(interessenten.maklerId, userId)),
        db
          .select()
          .from(termine)
          .where(eq(termine.maklerId, userId)),
      ]);

    const exportData = {
      exportiertAm: new Date().toISOString(),
      hinweis:
        "Datenexport gemaess Art. 20 DSGVO (Recht auf Datenuebertragbarkeit)",
      makler: maklerData[0] ?? null,
      objekte: objekteData,
      interessenten: interessentenData,
      termine: termineData,
    };

    const jsonString = JSON.stringify(exportData, null, 2);

    return new NextResponse(jsonString, {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="dsgvo-export-${userId}.json"`,
      },
    });
  } catch (error) {
    console.error("DSGVO export error:", error);
    return NextResponse.json(
      { error: "Interner Serverfehler" },
      { status: 500 },
    );
  }
}
