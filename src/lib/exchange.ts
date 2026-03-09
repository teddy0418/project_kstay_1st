/**
 * Frankfurter API - 무인증 환율 API
 * KRW → 엑심베이 DCC 12개국 통화 등 변환
 */
import type { Currency } from "@/lib/currency";
import { KRW_PER } from "@/lib/currency";

const CACHE_TTL_MS = 60 * 60 * 1000; // 1시간
let cached: { rates: Record<string, number>; ts: number } | null = null;

export type ExchangeRates = { KRW: 1; [k: string]: number };

const EXCHANGE_TO = "USD,JPY,SGD,HKD,THB,TWD,MYR,VND,PHP,EUR,GBP,AUD,IDR";

async function fetchRates(): Promise<Record<string, number>> {
  const url = `https://api.frankfurter.app/latest?from=KRW&to=${EXCHANGE_TO}`;
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

/** KRW_PER 역수 = 1 KRW당 해당 통화 (fallback) */
function fallbackRates(): Record<string, number> {
  const out: Record<string, number> = { KRW: 1 };
  for (const [code, per] of Object.entries(KRW_PER)) {
    if (code === "KRW") continue;
    out[code] = 1 / per;
  }
  return out;
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
    return { KRW: 1, ...fallbackRates() } as ExchangeRates;
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
