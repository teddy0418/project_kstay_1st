import { withAuth } from "next-auth/middleware";
import type { NextFetchEvent, NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { detectLangFromAcceptLanguage } from "@/lib/i18n/detect";

const authMiddleware = withAuth({
  pages: {
    signIn: "/auth",
  },
  callbacks: {
    authorized({ req, token }) {
      const pathname = req.nextUrl.pathname;
      const role = (token?.role as "GUEST" | "HOST" | "ADMIN" | undefined) ?? "GUEST";

      if (pathname.startsWith("/admin")) {
        return role === "ADMIN";
      }

      if (pathname.startsWith("/host")) {
        return !!token;
      }

      return true;
    },
  },
});

type AuthMiddlewareRequest = Parameters<typeof authMiddleware>[0];

export default async function proxy(req: NextRequest, ev: NextFetchEvent) {
  const pathname = req.nextUrl.pathname;
  const protectedRoute = pathname.startsWith("/admin") || pathname.startsWith("/host");
  const response =
    (protectedRoute ? ((await authMiddleware(req as AuthMiddlewareRequest, ev)) as NextResponse | undefined) : undefined) ??
    NextResponse.next();

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
  matcher: ["/((?!_next/static|_next/image|favicon.ico|manifest.webmanifest|icons|api).*)"],
};
