/**
 * Frankfurter API - 무인증 환율 API
 * https://www.frankfurter.app/docs/
 * KRW → USD, JPY, CNY 등 변환
 */
import type { Currency } from "@/lib/currency";

const CACHE_TTL_MS = 60 * 60 * 1000; // 1시간
let cached: { rates: Record<string, number>; ts: number } | null = null;

export type ExchangeRates = { KRW: 1; [k: string]: number };

async function fetchRates(): Promise<Record<string, number>> {
  const url = "https://api.frankfurter.app/latest?from=KRW&to=USD,JPY,CNY";
  const res = await fetch(url, { next: { revalidate: 3600 } });
  if (!res.ok) throw new Error("Exchange API error");
  const json = await res.json();
  const rates: Record<string, number> = { KRW: 1 };
  if (json.rates && typeof json.rates === "object") {
    for (const [k, v] of Object.entries(json.rates)) {
      if (typeof v === "number") rates[k] = v;
    }
  }
  return rates;
}

/**
 * 서버용: KRW 기준 환율 조회 (캐시 1시간)
 */
export async function getExchangeRates(): Promise<ExchangeRates> {
  const now = Date.now();
  if (cached && now - cached.ts < CACHE_TTL_MS) {
    return { KRW: 1, ...cached.rates } as ExchangeRates;
  }
  try {
    const rates = await fetchRates();
    cached = { rates, ts: now };
    return { KRW: 1, ...rates } as ExchangeRates;
  } catch {
    // fallback 정적 환율
    return {
      KRW: 1,
      USD: 0.00074,
      JPY: 0.11,
      CNY: 0.0054,
    } as ExchangeRates;
  }
}

/**
 * KRW 금액을 선택 통화로 변환
 */
export async function convertKRWTo(amountKRW: number, currency: Currency): Promise<number> {
  if (currency === "KRW") return amountKRW;
  const rates = await getExchangeRates();
  const rate = rates[currency];
  if (!rate || rate <= 0) return amountKRW;
  return amountKRW * rate;
}
