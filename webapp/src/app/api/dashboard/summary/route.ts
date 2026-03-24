import { NextResponse } from "next/server";
import { eq, count } from "drizzle-orm";
import { db } from "@/lib/db";
import { objekte, interessenten, termine } from "@/lib/db/schema";
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

    const [objekteCount, interessentenCount, termineCount] = await Promise.all([
      db
        .select({ count: count() })
        .from(objekte)
        .where(eq(objekte.maklerId, userId)),
      db
        .select({ count: count() })
        .from(interessenten)
        .where(eq(interessenten.maklerId, userId)),
      db
        .select({ count: count() })
        .from(termine)
        .where(eq(termine.maklerId, userId)),
    ]);

    return NextResponse.json({
      objekte: objekteCount[0].count,
      interessenten: interessentenCount[0].count,
      termine: termineCount[0].count,
    });
  } catch (error) {
    console.error("Dashboard summary error:", error);
    return NextResponse.json(
      { error: "Interner Serverfehler" },
      { status: 500 },
    );
  }
}
