"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { Currency } from "@/lib/currency";
import { apiClient } from "@/lib/api/client";

type Rates = Record<string, number>;
type Ctx = { rates: Rates | null; formatFromKRW: (amountKRW: number, currency: Currency) => string };

const ExchangeRatesContext = createContext<Ctx | null>(null);
const CACHE_KEY = "kst_exchange_rates";
const CACHE_TTL_MS = 60 * 60 * 1000;

const FALLBACK: Rates = { KRW: 1, USD: 0.00074, JPY: 0.11, CNY: 0.0054 };

function formatWith(amount: number, currency: Currency): string {
  if (currency === "KRW") return `₩${new Intl.NumberFormat("en-US").format(Math.round(amount))}`;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
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
      const value = rate != null && rate > 0 ? amountKRW * rate : amountKRW / 1350; // fallback USD rate
      return formatWith(value, currency);
    };
  }, [rates]);

  const value = useMemo(() => ({ rates, formatFromKRW }), [rates, formatFromKRW]);
  return <ExchangeRatesContext.Provider value={value}>{children}</ExchangeRatesContext.Provider>;
}

export function useExchangeRates() {
  const ctx = useContext(ExchangeRatesContext);
  if (!ctx) throw new Error("useExchangeRates must be used within ExchangeRatesProvider");
  return ctx;
}
