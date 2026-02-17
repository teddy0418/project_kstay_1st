import { formatKRW } from "@/lib/format";

export type Currency = "USD" | "JPY" | "CNY" | "KRW";

export const SUPPORTED_CURRENCIES: Currency[] = ["USD", "JPY", "CNY", "KRW"];
export const DEFAULT_CURRENCY: Currency = "USD";

export const KRW_PER: Record<Currency, number> = {
  USD: 1350,
  JPY: 9.2,
  CNY: 185,
  KRW: 1,
};

export function convertFromKRW(amountKRW: number, currency: Currency) {
  return amountKRW / KRW_PER[currency];
}

export function formatMainFromKRW(amountKRW: number, currency: Currency) {
  if (currency === "KRW") return formatKRW(amountKRW);
  const value = convertFromKRW(amountKRW, currency);
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatMainCompactFromKRW(amountKRW: number, currency: Currency) {
  if (currency === "KRW") return formatKRW(amountKRW);
  const value = convertFromKRW(amountKRW, currency);
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatDualPriceFromKRW(amountKRW: number, currency: Currency) {
  return {
    main: formatMainFromKRW(amountKRW, currency),
    approxKRW: formatKRW(amountKRW),
  };
}
