"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { Currency } from "@/lib/currency";
import { CURRENCY_SYMBOL, KRW_PER } from "@/lib/currency";
import { EXCHANGE_RATE_MARKUP } from "@/lib/policy";
import { apiClient } from "@/lib/api/client";

type Rates = Record<string, number>;
type Ctx = {
  rates: Rates | null;
  formatFromKRW: (amountKRW: number, currency: Currency) => string;
  formatFromKRWCompact: (amountKRW: number, currency: Currency) => string;
};

const ExchangeRatesContext = createContext<Ctx | null>(null);
const CACHE_KEY = "kst_exchange_rates";
const CACHE_TTL_MS = 60 * 60 * 1000;

const FALLBACK: Rates = { KRW: 1 };
for (const [code, per] of Object.entries(KRW_PER)) {
  if (code !== "KRW") FALLBACK[code] = 1 / per;
}

/** 통화별 소수 자리: JPY/VND/IDR/KRW 정수, 나머지 2자리 */
const DECIMALS: Record<Currency, number> = {
  USD: 2,
  JPY: 0,
  SGD: 2,
  HKD: 2,
  THB: 2,
  TWD: 2,
  MYR: 2,
  VND: 0,
  PHP: 2,
  EUR: 2,
  GBP: 2,
  AUD: 2,
  IDR: 0,
  KRW: 0,
};

/** 기호: KRW만 접미사(10,000₩), 나머지 접두사. CURRENCY_SYMBOL 사용 */
function formatFull(amount: number, currency: Currency): string {
  const decimals = DECIMALS[currency];
  const rounded =
    decimals === 0 ? Math.round(amount) : Math.round(amount * 100) / 100;
  const numStr = new Intl.NumberFormat("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(rounded);
  const sym = CURRENCY_SYMBOL[currency];
  return currency === "KRW" ? `${numStr}${sym}` : `${sym}${numStr}`;
}

function formatWith(amount: number, currency: Currency, compact = false): string {
  const decimals = DECIMALS[currency];
  const rounded =
    decimals === 0 ? Math.round(amount) : Math.round(amount * 100) / 100;
  if (compact) {
    const threshold = currency === "KRW" || currency === "VND" || currency === "IDR" ? 10000 : 1000;
    if (Math.abs(rounded) >= threshold) {
      const k = rounded / 1000;
      const kRounded = Math.round(k);
      const numStr = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(kRounded) + "k";
      const sym = CURRENCY_SYMBOL[currency];
      return currency === "KRW" ? `${numStr}${sym}` : `${sym}${numStr}`;
    }
  }
  return formatFull(amount, currency);
}

export function ExchangeRatesProvider({ children }: { children: React.ReactNode }) {
  const [rates, setRates] = useState<Rates | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const cached = typeof window !== "undefined" && localStorage.getItem(CACHE_KEY);
        if (cached) {
          const { data, ts } = JSON.parse(cached);
          if (Date.now() - ts < CACHE_TTL_MS && data && typeof data === "object") {
            setRates({ ...FALLBACK, ...data });
            return;
          }
        }
        const data = await apiClient.get<Rates>("/api/exchange");
        if (data && typeof data === "object") {
          setRates({ ...FALLBACK, ...data });
          localStorage.setItem(CACHE_KEY, JSON.stringify({ data, ts: Date.now() }));
        } else {
          setRates(FALLBACK);
        }
      } catch {
        setRates(FALLBACK);
      }
    };
    load();
  }, []);

  /** 게스트 노출가 = (원화 합계 × 환율) × 1.015 (환율 버퍼). KRW는 버퍼 없음. */
  const formatFromKRW = useMemo(() => {
    return (amountKRW: number, currency: Currency): string => {
      if (currency === "KRW") return formatWith(amountKRW, "KRW", false);
      const r = rates ?? FALLBACK;
      const rate = r[currency];
      const fallbackRate = 1 / KRW_PER[currency];
      const raw = rate != null && rate > 0 ? amountKRW * rate : amountKRW * fallbackRate;
      const value = raw * EXCHANGE_RATE_MARKUP;
      return formatWith(value, currency, false);
    };
  }, [rates]);

  const formatFromKRWCompact = useMemo(() => {
    return (amountKRW: number, currency: Currency): string => {
      if (currency === "KRW") return formatWith(amountKRW, "KRW", true);
      const r = rates ?? FALLBACK;
      const rate = r[currency];
      const fallbackRate = 1 / KRW_PER[currency];
      const raw = rate != null && rate > 0 ? amountKRW * rate : amountKRW * fallbackRate;
      const value = raw * EXCHANGE_RATE_MARKUP;
      return formatWith(value, currency, true);
    };
  }, [rates]);

  const value = useMemo(
    () => ({ rates, formatFromKRW, formatFromKRWCompact }),
    [rates, formatFromKRW, formatFromKRWCompact]
  );
  return <ExchangeRatesContext.Provider value={value}>{children}</ExchangeRatesContext.Provider>;
}

const FALLBACK_EXCHANGE: Ctx = {
  rates: null,
  formatFromKRW: (amountKRW: number, currency: Currency) => formatWith(
    currency === "KRW" ? amountKRW : amountKRW * (1 / KRW_PER[currency]) * EXCHANGE_RATE_MARKUP,
    currency,
    false
  ),
  formatFromKRWCompact: (amountKRW: number, currency: Currency) => formatWith(
    currency === "KRW" ? amountKRW : amountKRW * (1 / KRW_PER[currency]) * EXCHANGE_RATE_MARKUP,
    currency,
    true
  ),
};

export function useExchangeRates() {
  const ctx = useContext(ExchangeRatesContext);
  if (ctx) return ctx;

  if (process.env.NODE_ENV !== "production") {
    console.warn("[exchange] useExchangeRates called without <ExchangeRatesProvider/>; falling back to defaults");
  }
  return FALLBACK_EXCHANGE;
}
