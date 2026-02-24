import type { NextFetchEvent, NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { detectLangFromAcceptLanguage } from "@/lib/i18n/detect";

function isHostEntryPath(pathname: string): boolean {
  if (pathname === "/host") return true;
  if (pathname === "/host/onboarding" || pathname.startsWith("/host/onboarding/")) return true;
  if (pathname === "/host/listings/new" || pathname.startsWith("/host/listings/new/")) return true;
  return false;
}

export default async function proxy(req: NextRequest, _ev: NextFetchEvent) {
  const pathname = req.nextUrl.pathname;
  const secret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET;
  const token = secret ? await getToken({ req, secret }) : null;
  const role = (token?.role as string) || "GUEST";

  if (pathname.startsWith("/admin")) {
    if (!token?.sub) {
      const login = new URL("/login", req.url);
      login.searchParams.set("next", pathname);
      return NextResponse.redirect(login);
    }
    if (role !== "ADMIN") {
      return NextResponse.redirect(new URL("/", req.url));
    }
  }

  if (pathname.startsWith("/host")) {
    if (isHostEntryPath(pathname)) {
      // GUEST can access entry paths (onboarding, new listing)
    } else {
      if (!token?.sub) {
        const login = new URL("/login", req.url);
        login.searchParams.set("next", pathname);
        return NextResponse.redirect(login);
      }
      if (role !== "HOST" && role !== "ADMIN") {
        return NextResponse.redirect(new URL("/host/onboarding", req.url));
      }
    }
  }

  const response = NextResponse.next();

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
