import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { makler } from "@/lib/db/schema";
import { verifyPassword } from "@/lib/auth/password";
import { signToken } from "@/lib/auth/jwt";
import { setSessionCookie } from "@/lib/auth/session";

const loginSchema = z.object({
  email: z.string().email("Ungueltige E-Mail-Adresse"),
  password: z.string().min(1, "Passwort ist erforderlich"),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = loginSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validierungsfehler", details: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const { email, password } = parsed.data;

    const [user] = await db
      .select({
        id: makler.id,
        email: makler.email,
        passwordHash: makler.passwordHash,
        displayName: makler.displayName,
        subscriptionTier: makler.subscriptionTier,
        createdAt: makler.createdAt,
      })
      .from(makler)
      .where(eq(makler.email, email))
      .limit(1);

    if (!user) {
      return NextResponse.json(
        { error: "Ungueltige E-Mail oder Passwort" },
        { status: 401 },
      );
    }

    const passwordValid = await verifyPassword(password, user.passwordHash);

    if (!passwordValid) {
      return NextResponse.json(
        { error: "Ungueltige E-Mail oder Passwort" },
        { status: 401 },
      );
    }

    const token = await signToken({
      sub: user.id,
      email: user.email,
      tier: user.subscriptionTier,
    });

    const response = NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        subscriptionTier: user.subscriptionTier,
        createdAt: user.createdAt,
      },
    });

    setSessionCookie(response, token);

    return response;
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "Interner Serverfehler" },
      { status: 500 },
    );
  }
}
