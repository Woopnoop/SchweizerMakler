import { NextResponse, type NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db";
import { makler } from "@/lib/db/schema";
import { getSession, clearSessionCookie } from "@/lib/auth/session";

const deleteSchema = z.object({
  confirm: z.literal("LOESCHEN", {
    errorMap: () => ({
      message: 'Zur Bestaetigung muss "LOESCHEN" gesendet werden',
    }),
  }),
});

export async function DELETE(request: NextRequest) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json(
        { error: "Nicht authentifiziert" },
        { status: 401 },
      );
    }

    const body = await request.json();
    const parsed = deleteSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validierungsfehler", details: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const userId = session.sub;

    // Delete makler record — CASCADE will remove interessenten, objekte, termine
    await db.delete(makler).where(eq(makler.id, userId));

    const response = NextResponse.json({
      message: "Konto und alle zugehoerigen Daten wurden geloescht",
    });

    clearSessionCookie(response);

    return response;
  } catch (error) {
    console.error("Account deletion error:", error);
    return NextResponse.json(
      { error: "Interner Serverfehler" },
      { status: 500 },
    );
  }
}
