import { headers } from "next/headers";
import { geoCountryToLocale } from "@/lib/geo";
import { apiOk } from "@/lib/api/response";

/**
 * IP 기반 국가 감지 API
 * 1. x-vercel-ip-country (Vercel 배포 시) 우선 사용
 * 2. fallback: 외부 GeoIP API (로컬 등)
 */
export async function GET() {
  const h = await headers();
  let country = h.get("x-vercel-ip-country")?.trim() ?? null;

  if (!country) {
    try {
      const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip")?.trim();
      if (ip && ip !== "127.0.0.1" && ip !== "::1") {
        const res = await fetch(`https://ipapi.co/${ip}/country_code/`, { next: { revalidate: 3600 } });
        if (res.ok) {
          const text = await res.text();
          const c = text?.trim()?.toUpperCase()?.slice(0, 2);
          if (c && c.length === 2) country = c;
        }
      }
    } catch {
      // ignore
    }
  }

  const locale = geoCountryToLocale(country);
  return apiOk({ country: country ?? "UNKNOWN", ...locale });
}
