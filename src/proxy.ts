import type { NextFetchEvent, NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { detectLangFromAcceptLanguage } from "@/lib/i18n/detect";

const allowDemoAuth =
  process.env.NODE_ENV !== "production" &&
  process.env.KSTAY_ENABLE_DEMO_AUTH === "true";

function isHostEntryPath(pathname: string): boolean {
  if (pathname === "/host") return true;
  if (pathname === "/host/onboarding" || pathname.startsWith("/host/onboarding/")) return true;
  if (pathname === "/host/listings/new" || pathname.startsWith("/host/listings/new/")) return true;
  return false;
}

function addSecurityHeaders(response: NextResponse): NextResponse {
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("X-DNS-Prefetch-Control", "on");
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=(self)"
  );
  if (process.env.NODE_ENV === "production") {
    response.headers.set(
      "Strict-Transport-Security",
      "max-age=63072000; includeSubDomains; preload"
    );
    response.headers.set(
      "Content-Security-Policy",
      [
        "default-src 'self'",
        "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.portone.io https://accounts.google.com https://apis.google.com",
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
        "font-src 'self' https://fonts.gstatic.com",
        "img-src 'self' data: blob: https: http:",
        "connect-src 'self' https://api.portone.io https://accounts.google.com https://*.googleapis.com https://api.exchangerate-api.com https://*.tile.openstreetmap.org https://kauth.kakao.com https://access.line.me https://www.facebook.com",
        "frame-src 'self' https://www.google.com https://accounts.google.com https://cdn.portone.io https://kauth.kakao.com https://access.line.me https://www.facebook.com",
        "frame-ancestors 'none'",
        "base-uri 'self'",
        "form-action 'self' https://kauth.kakao.com https://access.line.me https://www.facebook.com",
        "object-src 'none'",
      ].join("; ")
    );
  }
  return response;
}

function jsonError(code: string, message: string, status: number) {
  return NextResponse.json({ error: { code, message } }, { status });
}

function resolveAuth(
  req: NextRequest,
  token: { sub?: string; role?: unknown } | null
): { isAuthenticated: boolean; role: string } {
  if (token?.sub) {
    return { isAuthenticated: true, role: (token.role as string) || "GUEST" };
  }
  if (allowDemoAuth) {
    const demoRole = req.cookies.get("kst_role")?.value?.toUpperCase();
    if (demoRole === "ADMIN" || demoRole === "HOST" || demoRole === "GUEST") {
      return { isAuthenticated: true, role: demoRole };
    }
  }
  return { isAuthenticated: false, role: "GUEST" };
}

export default async function proxy(req: NextRequest, _ev: NextFetchEvent): Promise<NextResponse> {
  void _ev;
  const pathname = req.nextUrl.pathname;
  const secret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET;
  const token = secret ? await getToken({ req, secret }) : null;
  const { isAuthenticated, role } = resolveAuth(req, token);

  // ── Admin API routes ──
  if (pathname.startsWith("/api/admin")) {
    if (!isAuthenticated) return jsonError("UNAUTHORIZED", "Login required", 401);
    if (role !== "ADMIN") return jsonError("FORBIDDEN", "Admin access required", 403);
    return addSecurityHeaders(NextResponse.next());
  }

  // ── Host API routes ──
  if (pathname.startsWith("/api/host")) {
    if (!isAuthenticated) return jsonError("UNAUTHORIZED", "Login required", 401);
    return addSecurityHeaders(NextResponse.next());
  }

  // ── Admin pages ──
  if (pathname.startsWith("/admin")) {
    if (!isAuthenticated) {
      const login = new URL("/login", req.url);
      login.searchParams.set("next", pathname);
      return NextResponse.redirect(login);
    }
    if (role !== "ADMIN") {
      return NextResponse.redirect(new URL("/", req.url));
    }
  }

  // ── Host pages ──
  if (pathname.startsWith("/host")) {
    if (isHostEntryPath(pathname)) {
      // Any user (including GUEST) can access entry paths for onboarding
    } else {
      if (!isAuthenticated) {
        const login = new URL("/login", req.url);
        login.searchParams.set("next", pathname);
        return NextResponse.redirect(login);
      }
      if (role !== "HOST" && role !== "ADMIN") {
        return NextResponse.redirect(new URL("/host/onboarding", req.url));
      }
    }
  }

  const response = addSecurityHeaders(NextResponse.next());

  // ── Auto-detect language on first visit ──
  const hasLangCookie = Boolean(req.cookies.get("kstay_lang")?.value || req.cookies.get("kst_lang")?.value);
  if (!hasLangCookie) {
    const detected = detectLangFromAcceptLanguage(req.headers.get("accept-language"));
    const cookieOpts = { path: "/", maxAge: 60 * 60 * 24 * 365, sameSite: "lax" as const };
    response.cookies.set("kstay_lang", detected, cookieOpts);
    response.cookies.set("kst_lang", detected, cookieOpts);
  }

  return response;
}

export const config = {
  matcher: [
    "/api/admin/:path*",
    "/api/host/:path*",
    "/((?!_next/static|_next/image|favicon.ico|manifest.webmanifest|icons|sw\\.js|uploads|brands|destinations|fonts|images).*)",
  ],
};
