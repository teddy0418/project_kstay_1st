import { NextRequest, NextResponse } from "next/server";
import { requireHost } from "@/lib/api/auth-guard";
import { checkRateLimit, RATE_LIMITS, rateLimitResponse } from "@/lib/api/rate-limit";

export type GeoAutocompleteResult = {
  label: string;
  address: string;
  lat: number;
  lng: number;
  city?: string;
  area?: string;
  stateProvince?: string;
  cityDistrict?: string;
  roadAddress?: string;
  zipCode?: string;
};

const NOMINATIM_BASE = "https://nominatim.openstreetmap.org";
const KAKAO_BASE = "https://dapi.kakao.com/v2/local/search/address.json";
const Q_MAX_LENGTH = 100;

function safeString(v: unknown): string | undefined {
  return typeof v === "string" && v.trim().length > 0 ? v.trim() : undefined;
}

export async function GET(request: NextRequest) {
  const auth = await requireHost();
  if (!auth.ok) return auth.response;

  const rl = checkRateLimit(auth.user.id, RATE_LIMITS.api);
  if (!rl.allowed) return rateLimitResponse();

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
