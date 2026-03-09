import type { Currency } from "@/lib/currency";

/**
 * 국가 코드 → 언어/통화 매핑 (IP 기반 자동 감지용)
 * 사용자 수동 선택(쿠키/localStorage)이 없을 때만 적용
 */
export type GeoLocale = { lang: "en" | "ko" | "ja" | "zh"; currency: Currency };

const COUNTRY_TO_LOCALE: Record<string, GeoLocale> = {
  KR: { lang: "ko", currency: "KRW" },
  JP: { lang: "ja", currency: "JPY" },
  CN: { lang: "zh", currency: "USD" },
  SG: { lang: "en", currency: "SGD" },
  HK: { lang: "en", currency: "HKD" },
  TH: { lang: "en", currency: "THB" },
  MY: { lang: "en", currency: "MYR" },
  ID: { lang: "en", currency: "IDR" },
  PH: { lang: "en", currency: "PHP" },
  TW: { lang: "en", currency: "TWD" },
  VN: { lang: "en", currency: "VND" },
};

const DEFAULT_LOCALE: GeoLocale = { lang: "en", currency: "USD" };

/**
 * 국가 코드(ISO 3166-1 alpha-2)로 언어/통화 결정
 */
export function geoCountryToLocale(countryCode: string | null | undefined): GeoLocale {
  if (!countryCode || typeof countryCode !== "string") return DEFAULT_LOCALE;
  const key = countryCode.trim().toUpperCase().slice(0, 2);
  return COUNTRY_TO_LOCALE[key] ?? DEFAULT_LOCALE;
}
