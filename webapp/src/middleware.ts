import { NextResponse, type NextRequest } from "next/server";
import { verifyToken } from "@/lib/auth/jwt";

const PUBLIC_PATHS = [
  "/",
  "/login",
  "/register",
  "/impressum",
  "/datenschutz",
  "/api/auth",
  "/api/rechner",
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Public routes durchlassen
  if (PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"))) {
    return NextResponse.next();
  }

  // Static assets und Next.js internals durchlassen
  if (pathname.startsWith("/_next") || pathname.startsWith("/favicon")) {
    return NextResponse.next();
  }

  // Session prüfen
  const token = request.cookies.get("session")?.value;
  if (!token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const payload = await verifyToken(token);
  if (!payload) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // User-Infos als Header für API Routes
  const response = NextResponse.next();
  response.headers.set("x-makler-id", payload.sub);
  response.headers.set("x-makler-tier", payload.tier);

  return response;
}

export const config = {
  matcher: ["/dashboard/:path*", "/api/objekte/:path*", "/api/interessenten/:path*", "/api/termine/:path*", "/api/dsgvo/:path*", "/api/dashboard/:path*"],
};
