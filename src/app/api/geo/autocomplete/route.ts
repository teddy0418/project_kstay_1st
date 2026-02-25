import { NextRequest, NextResponse } from "next/server";
import { getServerSessionUser } from "@/lib/auth/server";

export type GeoAutocompleteResult = {
  label: string;
  address: string;
  lat: number;
  lng: number;
  city?: string;
  area?: string;
  /** 구조화: 시/도, 시/군/구, 도로명, 우편번호 */
  stateProvince?: string;
  cityDistrict?: string;
  roadAddress?: string;
  zipCode?: string;
};

const NOMINATIM_BASE = "https://nominatim.openstreetmap.org";
const KAKAO_BASE = "https://dapi.kakao.com/v2/local/search/address.json";
const Q_MAX_LENGTH = 100;
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 30;

const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(userId);
  if (!entry) {
    rateLimitMap.set(userId, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }
  if (now >= entry.resetAt) {
    entry.count = 1;
    entry.resetAt = now + RATE_LIMIT_WINDOW_MS;
    return true;
  }
  entry.count++;
  if (entry.count > RATE_LIMIT_MAX) return false;
  return true;
}

function safeString(v: unknown): string | undefined {
  return typeof v === "string" && v.trim().length > 0 ? v.trim() : undefined;
}

/**
 * 주소 자동완성: HOST/ADMIN 세션만 허용. 유저당 rate limit. API 키는 서버만 사용.
 * 우선순위: KAKAO_REST_API_KEY → Nominatim(무료, 레이트리밋 주의).
 */
export async function GET(request: NextRequest) {
  const user = await getServerSessionUser();
  if (!user || (user.role !== "HOST" && user.role !== "ADMIN")) {
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "호스트 또는 관리자 로그인이 필요합니다." } },
      { status: 401 }
    );
  }

  if (!checkRateLimit(user.id)) {
    return NextResponse.json(
      { error: { code: "RATE_LIMIT", message: "요청이 너무 많습니다. 잠시 후 다시 시도해 주세요." } },
      { status: 429 }
    );
  }

  const q = request.nextUrl.searchParams.get("q")?.trim();
  if (!q || q.length < 2) {
    return NextResponse.json(
      { error: { code: "VALIDATION_ERROR", message: "q는 2자 이상 필요합니다." } },
      { status: 400 }
    );
  }
  if (q.length > Q_MAX_LENGTH) {
    return NextResponse.json(
      { error: { code: "VALIDATION_ERROR", message: "검색어는 100자 이내로 입력해 주세요." } },
      { status: 400 }
    );
  }

  const kakaoKey = process.env.KAKAO_REST_API_KEY;

  if (kakaoKey) {
    try {
      const res = await fetch(
        `${KAKAO_BASE}?query=${encodeURIComponent(q)}&size=10`,
        {
          headers: { Authorization: `KakaoAK ${kakaoKey}` },
          next: { revalidate: 0 },
        }
      );
      if (!res.ok) {
        const err = await res.text();
        console.warn("[geo/autocomplete] Kakao error:", res.status, err);
        return fallbackNominatim(q);
      }
      const json = (await res.json()) as {
        documents?: Array<{
          address_name: string;
          address?: { region_1depth_name?: string; region_2depth_name?: string };
          road_address?: { address_name?: string; zone_no?: string };
          x?: string;
          y?: string;
        }>;
      };
      const documents = json.documents ?? [];
      const results: GeoAutocompleteResult[] = documents.map((doc) => {
        const roadAddr = safeString(doc.road_address?.address_name);
        const addr = roadAddr || doc.address_name;
        const lat = parseFloat(doc.y ?? "0");
        const lng = parseFloat(doc.x ?? "0");
        const stateProvince = safeString(doc.address?.region_1depth_name);
        const cityDistrict = safeString(doc.address?.region_2depth_name);
        return {
          label: typeof addr === "string" ? addr : String(doc.address_name ?? ""),
          address: typeof addr === "string" ? addr : String(doc.address_name ?? ""),
          lat: Number.isFinite(lat) ? lat : 0,
          lng: Number.isFinite(lng) ? lng : 0,
          city: stateProvince,
          area: cityDistrict,
          stateProvince,
          cityDistrict,
          roadAddress: roadAddr,
          zipCode: safeString(doc.road_address?.zone_no),
        };
      });
      return NextResponse.json({ data: { results } });
    } catch (e) {
      console.warn("[geo/autocomplete] Kakao fetch failed:", e);
      return fallbackNominatim(q);
    }
  }

  return fallbackNominatim(q);
}

async function fallbackNominatim(q: string): Promise<NextResponse> {
  try {
    const url = `${NOMINATIM_BASE}/search?q=${encodeURIComponent(q)}&format=json&limit=8`;
    const res = await fetch(url, {
      headers: { "User-Agent": "KSTAY-Host/1.0 (address-autocomplete)" },
      next: { revalidate: 0 },
    });
    if (!res.ok) {
      const err = await res.text();
      return NextResponse.json(
        { error: { code: "GEO_ERROR", message: err || "Geocoding failed." } },
        { status: 502 }
      );
    }
    const arr = (await res.json()) as Array<{ display_name?: string; lat?: string; lon?: string }>;
    const results: GeoAutocompleteResult[] = (arr ?? []).map((item) => ({
      label: item.display_name ?? "",
      address: item.display_name ?? "",
      lat: parseFloat(item.lat ?? "0") || 0,
      lng: parseFloat(item.lon ?? "0") || 0,
    }));
    return NextResponse.json({ data: { results } });
  } catch (e) {
    console.warn("[geo/autocomplete] Nominatim failed:", e);
    return NextResponse.json(
      { error: { code: "GEO_ERROR", message: "주소 검색에 실패했습니다." } },
      { status: 502 }
    );
  }
}
