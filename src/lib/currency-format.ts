import type { Currency } from "@/lib/currency";

/** 통화별 기호 위치: 앞(prefix) 또는 뒤(suffix). 예: $100, 10,000₩, ¥12,000 */
const CURRENCY_SYMBOL: Record<Currency, { symbol: string; position: "before" | "after" }> = {
  USD: { symbol: "$", position: "before" },
  JPY: { symbol: "¥", position: "before" },
  CNY: { symbol: "¥", position: "before" },
  KRW: { symbol: "₩", position: "after" },
};

/** 통화별 소수 자릿수. USD는 2자리, KRW/JPY/CNY는 0 */
const CURRENCY_DECIMALS: Record<Currency, number> = {
  USD: 2,
  JPY: 0,
  CNY: 0,
  KRW: 0,
};

/** K 약칭 사용 임계값: 이 값 이상이면 "479k" 형태로 표시 (셀 깨짐 방지) */
const COMPACT_THRESHOLD: Record<Currency, number> = {
  USD: 1000,
  JPY: 1000,
  CNY: 1000,
  KRW: 10000,
};

function formatNumber(value: number, decimals: number, useCompact: boolean): string {
  if (useCompact && value >= COMPACT_THRESHOLD.KRW) {
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
 * 이미 변환된 금액(해당 통화 값)을 기호 위치·소수·천 단위 구분에 맞춰 포맷.
 * - USD: $123.45 (앞, 2자리)
 * - KRW: 479,447₩ (뒤, 0자리)
 * - JPY: ¥12,000 (앞, 0자리)
 */
export function formatCurrencyDisplay(
  amount: number,
  currency: Currency,
  opts?: { compact?: boolean }
): string {
  const decimals = CURRENCY_DECIMALS[currency];
  const { symbol, position } = CURRENCY_SYMBOL[currency];
  const threshold = COMPACT_THRESHOLD[currency];
  const useCompact = opts?.compact === true && amount >= threshold;

  const rounded = decimals === 0 ? Math.round(amount) : Math.round(amount * 100) / 100;
  const numStr = formatNumber(rounded, decimals, useCompact);

  if (position === "before") {
    return `${symbol}${numStr}`;
  }
  return `${numStr}${symbol}`;
}
