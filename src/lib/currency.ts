import { formatKRW } from "@/lib/format";

/** 엑심베이 신용카드 DCC 지원 주요 12개국 + IDR(인도네시아) + KRW(기준통화) */
export type Currency =
  | "USD"
  | "JPY"
  | "SGD"
  | "HKD"
  | "THB"
  | "TWD"
  | "MYR"
  | "VND"
  | "PHP"
  | "EUR"
  | "GBP"
  | "AUD"
  | "IDR"
  | "KRW";

export const SUPPORTED_CURRENCIES: Currency[] = [
  "USD",
  "JPY",
  "SGD",
  "HKD",
  "THB",
  "TWD",
  "MYR",
  "VND",
  "PHP",
  "EUR",
  "GBP",
  "AUD",
  "IDR",
  "KRW",
];
export const DEFAULT_CURRENCY: Currency = "USD";

/** KRW 1원당 해당 통화 환율 (fallback/정적용). 실시간은 api/exchange 사용 */
export const KRW_PER: Record<Currency, number> = {
  KRW: 1,
  USD: 1350,
  JPY: 9.2,
  SGD: 1000,
  HKD: 173,
  THB: 37,
  TWD: 42,
  MYR: 289,
  VND: 0.054,
  PHP: 23,
  EUR: 1460,
  GBP: 1710,
  AUD: 880,
  IDR: 0.09,
};

/** 통화별 표시 기호 ($, ¥, ฿ 등) */
export const CURRENCY_SYMBOL: Record<Currency, string> = {
  KRW: "₩",
  USD: "$",
  JPY: "¥",
  SGD: "S$",
  HKD: "HK$",
  THB: "฿",
  TWD: "NT$",
  MYR: "RM",
  VND: "₫",
  PHP: "₱",
  EUR: "€",
  GBP: "£",
  AUD: "A$",
  IDR: "Rp",
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
    maximumFractionDigits: currency === "JPY" || currency === "VND" || currency === "IDR" ? 0 : 2,
  }).format(value);
}

export function formatMainCompactFromKRW(amountKRW: number, currency: Currency) {
  if (currency === "KRW") return formatKRW(amountKRW);
  const value = convertFromKRW(amountKRW, currency);
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: currency === "JPY" || currency === "VND" || currency === "IDR" ? 0 : 2,
  }).format(value);
}

export function formatDualPriceFromKRW(amountKRW: number, currency: Currency) {
  return {
    main: formatMainFromKRW(amountKRW, currency),
    approxKRW: formatKRW(amountKRW),
  };
}
