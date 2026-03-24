import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { makler } from "@/lib/db/schema";
import { hashPassword } from "@/lib/auth/password";
import { signToken } from "@/lib/auth/jwt";
import { setSessionCookie } from "@/lib/auth/session";

const registerSchema = z.object({
  email: z.string().email("Ungueltige E-Mail-Adresse"),
  password: z.string().min(8, "Passwort muss mindestens 8 Zeichen lang sein"),
  displayName: z.string().min(2, "Anzeigename muss mindestens 2 Zeichen lang sein"),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validierungsfehler", details: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const { email, password, displayName } = parsed.data;

    // Check email uniqueness
    const existing = await db
      .select({ id: makler.id })
      .from(makler)
      .where(eq(makler.email, email))
      .limit(1);

    if (existing.length > 0) {
      return NextResponse.json(
        { error: "Ein Konto mit dieser E-Mail-Adresse existiert bereits" },
        { status: 409 },
      );
    }

    const passwordHash = await hashPassword(password);

    const [inserted] = await db
      .insert(makler)
      .values({
        email,
        passwordHash,
        displayName,
        subscriptionTier: "basis",
      })
      .returning({
        id: makler.id,
        email: makler.email,
        displayName: makler.displayName,
        subscriptionTier: makler.subscriptionTier,
        createdAt: makler.createdAt,
      });

    const token = await signToken({
      sub: inserted.id,
      email: inserted.email,
      tier: inserted.subscriptionTier,
    });

    const response = NextResponse.json(
      {
        user: {
          id: inserted.id,
          email: inserted.email,
          displayName: inserted.displayName,
          subscriptionTier: inserted.subscriptionTier,
          createdAt: inserted.createdAt,
        },
      },
      { status: 201 },
    );

    setSessionCookie(response, token);

    return response;
  } catch (error) {
    console.error("Register error:", error);
    return NextResponse.json(
      { error: "Interner Serverfehler" },
      { status: 500 },
    );
  }
}
