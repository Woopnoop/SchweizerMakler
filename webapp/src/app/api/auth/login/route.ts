import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { signToken } from "@/lib/auth/jwt";
import { setSessionCookie } from "@/lib/auth/session";

const loginSchema = z.object({
  email: z.string().min(1, "Benutzername oder E-Mail erforderlich"),
  password: z.string().min(1, "Passwort ist erforderlich"),
});

// Eingebauter Gast-Account (funktioniert ohne Datenbank)
const GUEST_USER = {
  id: "00000000-0000-0000-0000-000000000001",
  email: "gast",
  displayName: "Gast",
  subscriptionTier: "pro",
  passwordHash: "gast1",
};

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

    // Gast-Login (ohne Datenbank)
    if (email === "gast" && password === "gast1") {
      const token = await signToken({
        sub: GUEST_USER.id,
        email: GUEST_USER.email,
        tier: GUEST_USER.subscriptionTier,
      });

      const response = NextResponse.json({
        user: {
          id: GUEST_USER.id,
          email: GUEST_USER.email,
          displayName: GUEST_USER.displayName,
          subscriptionTier: GUEST_USER.subscriptionTier,
        },
      });

      setSessionCookie(response, token);
      return response;
    }

    // Datenbank-Login (falls DB verfügbar)
    try {
      const { db } = await import("@/lib/db");
      const { makler } = await import("@/lib/db/schema");
      const { eq } = await import("drizzle-orm");
      const { verifyPassword } = await import("@/lib/auth/password");

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
          { error: "Ungültige Zugangsdaten" },
          { status: 401 },
        );
      }

      const passwordValid = await verifyPassword(password, user.passwordHash);
      if (!passwordValid) {
        return NextResponse.json(
          { error: "Ungültige Zugangsdaten" },
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
    } catch {
      // DB nicht verfügbar
      return NextResponse.json(
        { error: "Ungültige Zugangsdaten" },
        { status: 401 },
      );
    }
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "Interner Serverfehler" },
      { status: 500 },
    );
  }
}
