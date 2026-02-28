"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { Currency } from "@/lib/currency";
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

const FALLBACK: Rates = { KRW: 1, USD: 0.00074, JPY: 0.11, CNY: 0.0054 };

/** 통화별 소수 자리: USD 2자리, 그 외 0 */
const DECIMALS: Record<Currency, number> = { USD: 2, JPY: 0, CNY: 0, KRW: 0 };

/** 기호 위치: KRW만 접미사(10,000₩), 나머지 접두사($100, ¥12,000). 천 단위 콤마, 소수는 통화별 적용. */
function formatFull(amount: number, currency: Currency): string {
  const decimals = DECIMALS[currency];
  const rounded = currency === "KRW" ? Math.round(amount) : amount;
  const numStr = new Intl.NumberFormat("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(rounded);
  if (currency === "KRW") return `${numStr}₩`;
  if (currency === "USD") return `$${numStr}`;
  if (currency === "JPY") return `¥${numStr}`;
  if (currency === "CNY") return `¥${numStr}`;
  return numStr;
}

function formatWith(amount: number, currency: Currency, compact = false): string {
  const rounded = currency === "KRW" ? Math.round(amount) : amount;
  if (compact) {
    const threshold = currency === "KRW" ? 10000 : 1000;
    if (Math.abs(rounded) >= threshold) {
      const k = rounded / 1000;
      const kRounded = Math.round(k);
      const numStr = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(kRounded) + "k";
      if (currency === "KRW") return `${numStr}₩`;
      if (currency === "USD") return `$${numStr}`;
      if (currency === "JPY") return `¥${numStr}`;
      if (currency === "CNY") return `¥${numStr}`;
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

  const formatFromKRW = useMemo(() => {
    return (amountKRW: number, currency: Currency): string => {
      const r = rates ?? FALLBACK;
      const rate = r[currency];
      const value = rate != null && rate > 0 ? amountKRW * rate : amountKRW / 1350;
      return formatWith(value, currency, false);
    };
  }, [rates]);

  const formatFromKRWCompact = useMemo(() => {
    return (amountKRW: number, currency: Currency): string => {
      const r = rates ?? FALLBACK;
      const rate = r[currency];
      const value = rate != null && rate > 0 ? amountKRW * rate : amountKRW / 1350;
      return formatWith(value, currency, true);
    };
  }, [rates]);

  const value = useMemo(
    () => ({ rates, formatFromKRW, formatFromKRWCompact }),
    [rates, formatFromKRW, formatFromKRWCompact]
  );
  return <ExchangeRatesContext.Provider value={value}>{children}</ExchangeRatesContext.Provider>;
}

export function useExchangeRates() {
  const ctx = useContext(ExchangeRatesContext);
  if (!ctx) throw new Error("useExchangeRates must be used within ExchangeRatesProvider");
  return ctx;
}
