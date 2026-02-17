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

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  console.log("[KSTAY] CurrencyProvider mount (client)");
  const [currency, setCurrencyState] = useState<Currency>(DEFAULT_CURRENCY);

  useEffect(() => {
    const saved = window.localStorage.getItem("kst_currency") as Currency | null;
    if (saved && SUPPORTED_CURRENCIES.includes(saved)) {
      queueMicrotask(() => setCurrencyState(saved));
    }
  }, []);

  const setCurrency = (c: Currency) => {
    setCurrencyState(c);
    window.localStorage.setItem("kst_currency", c);
  };

  const value = useMemo(
    () => ({ currency, setCurrency, supported: SUPPORTED_CURRENCIES }),
    [currency]
  );

  return <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>;
}

export function useCurrency() {
  const ctx = useContext(CurrencyContext);
  if (!ctx) throw new Error("useCurrency must be used within CurrencyProvider");
  return ctx;
}
