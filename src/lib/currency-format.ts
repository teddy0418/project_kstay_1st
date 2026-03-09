import type { Currency } from "@/lib/currency";
import { CURRENCY_SYMBOL } from "@/lib/currency";

/** 통화별 기호 위치: KRW만 접미사(10,000₩), 나머지 접두사 */
const POSITION: Record<Currency, "before" | "after"> = {
  KRW: "after",
  USD: "before",
  JPY: "before",
  SGD: "before",
  HKD: "before",
  THB: "before",
  TWD: "before",
  MYR: "before",
  VND: "before",
  PHP: "before",
  EUR: "before",
  GBP: "before",
  AUD: "before",
  IDR: "before",
};

/** 통화별 소수 자리: JPY/VND/IDR/KRW 정수, 나머지 2자리 */
const CURRENCY_DECIMALS: Record<Currency, number> = {
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

/** K 약칭 사용 임계값 */
const COMPACT_THRESHOLD: Record<Currency, number> = {
  USD: 1000,
  JPY: 1000,
  SGD: 1000,
  HKD: 1000,
  THB: 1000,
  TWD: 1000,
  MYR: 1000,
  VND: 10000,
  PHP: 1000,
  EUR: 1000,
  GBP: 1000,
  AUD: 1000,
  IDR: 10000,
  KRW: 10000,
};

function formatNumber(value: number, decimals: number, useCompact: boolean, threshold: number): string {
  if (useCompact && value >= threshold) {
    const k = Math.round(value / 1000);
    return k >= 1000 ? `${(k / 1000).toFixed(1)}M` : `${k}k`;
  }
  const formatter = new Intl.NumberFormat("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
  return formatter.format(value);
}

/**
 * 이미 변환된 금액(해당 통화 값)을 기호·소수·천 단위에 맞춰 포맷.
 * 엑심베이 DCC 12개국 + KRW 기호 매칭.
 */
export function formatCurrencyDisplay(
  amount: number,
  currency: Currency,
  opts?: { compact?: boolean }
): string {
  const decimals = CURRENCY_DECIMALS[currency];
  const symbol = CURRENCY_SYMBOL[currency];
  const position = POSITION[currency];
  const threshold = COMPACT_THRESHOLD[currency];
  const useCompact = opts?.compact === true && amount >= threshold;

  const rounded = decimals === 0 ? Math.round(amount) : Math.round(amount * 100) / 100;
  const numStr = formatNumber(rounded, decimals, useCompact, threshold);

  if (position === "before") return `${symbol}${numStr}`;
  return `${numStr}${symbol}`;
}
