"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { Currency } from "@/lib/currency";
import { DEFAULT_CURRENCY, SUPPORTED_CURRENCIES } from "@/lib/currency";

type Ctx = {
  currency: Currency;
  setCurrency: (c: Currency) => void;
  supported: Currency[];
};

const CurrencyContext = createContext<Ctx | null>(null);

export function CurrencyProvider({
  children,
  initialCurrency,
}: {
  children: React.ReactNode;
  initialCurrency?: Currency;
}) {
  const [currency, setCurrencyState] = useState<Currency>(initialCurrency ?? DEFAULT_CURRENCY);

  useEffect(() => {
    const saved = window.localStorage.getItem("kst_currency") as Currency | null;
    if (saved && SUPPORTED_CURRENCIES.includes(saved)) {
      queueMicrotask(() => setCurrencyState(saved));
    } else if (initialCurrency && SUPPORTED_CURRENCIES.includes(initialCurrency)) {
      queueMicrotask(() => setCurrencyState(initialCurrency));
    }
  }, [initialCurrency]);

  const setCurrency = (c: Currency) => {
    setCurrencyState(c);
    window.localStorage.setItem("kst_currency", c);
    if (typeof document !== "undefined") {
      document.cookie = `kst_currency=${encodeURIComponent(c)}; Max-Age=${365 * 24 * 60 * 60}; Path=/; SameSite=Lax`;
    }
  };

  const value = useMemo(
    () => ({ currency, setCurrency, supported: SUPPORTED_CURRENCIES }),
    [currency]
  );

  return <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>;
}

const FALLBACK_CURRENCY: Ctx = {
  currency: DEFAULT_CURRENCY,
  setCurrency: () => {},
  supported: SUPPORTED_CURRENCIES,
};

export function useCurrency() {
  const ctx = useContext(CurrencyContext);
  if (ctx) return ctx;

  if (process.env.NODE_ENV !== "production") {
    console.warn("[currency] useCurrency called without <CurrencyProvider/>; falling back to defaults");
  }
  return FALLBACK_CURRENCY;
}
