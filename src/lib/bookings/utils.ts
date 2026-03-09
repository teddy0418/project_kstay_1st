import {
  freeCancellationDeadlineUtcMs,
  nonRefundableFreeCancelEndsAtUtcMs,
  formatKSTDateTimeFromUtcMs,
  FREE_CANCELLATION_DAYS,
} from "@/lib/policy";
import { nightsBetween, formatDateEn } from "@/lib/format";
import type { Currency } from "@/lib/currency";
import { KRW_PER, CURRENCY_SYMBOL } from "@/lib/currency";

const CANCELLATION_POLICY_VERSION = "v1-standard-5d";

/** Validates YYYY-MM-DD and returns Date at UTC midnight, or null. */
export function parseISODate(raw: unknown): Date | null {
  const s = String(raw ?? "");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return null;
  const d = new Date(`${s}T00:00:00.000Z`);
  if (Number.isNaN(d.getTime())) return null;
  return d;
}

export { nightsBetween, formatDateEn };

/** 표준 정책: 체크인 N일 전 23:59 KST (기본 5일) */
export function buildCancellationDeadlineKst(checkInISO: string, days: number = FREE_CANCELLATION_DAYS) {
  const utcMs = freeCancellationDeadlineUtcMs(checkInISO, days);
  return new Date(utcMs);
}

export function formatCancellationDeadlineKst(value: Date) {
  return formatKSTDateTimeFromUtcMs(value.getTime());
}

export type CancellationSnapshot = {
  cancellationDeadlineKst: Date;
  freeCancelEndsAt: Date;
  policyType: "STANDARD" | "NON_REFUNDABLE";
  cancellationPolicyVersion: string;
  refundSchedule: string;
};

/**
 * 예약 생성 시 무료 취소 마감 + 스냅샷 계산.
 * - STANDARD: 체크인 freeCancellationDays일 전 23:59 KST
 * - NON_REFUNDABLE: 예약 시각 + 24h (단, 체크인 48h 미만이면 바로 환불 불가)
 */
export function buildCancellationSnapshot(params: {
  checkInISO: string;
  isNonRefundableSpecial: boolean;
  bookingCreatedAtUtcMs: number;
  freeCancellationDays?: number | null;
  policyTextLocale?: string | null;
}): CancellationSnapshot {
  const days = params.freeCancellationDays ?? FREE_CANCELLATION_DAYS;

  if (params.isNonRefundableSpecial) {
    const utcMs = nonRefundableFreeCancelEndsAtUtcMs(params.bookingCreatedAtUtcMs, params.checkInISO);
    return {
      cancellationDeadlineKst: new Date(utcMs),
      freeCancelEndsAt: new Date(utcMs),
      policyType: "NON_REFUNDABLE",
      cancellationPolicyVersion: CANCELLATION_POLICY_VERSION,
      refundSchedule: JSON.stringify({
        type: "NON_REFUNDABLE",
        freeCancelEndsAtUtcMs: utcMs,
        note: "24h after booking (KST); if check-in <48h away, no grace.",
      }),
    };
  }

  const utcMs = freeCancellationDeadlineUtcMs(params.checkInISO, days);
  return {
    cancellationDeadlineKst: new Date(utcMs),
    freeCancelEndsAt: new Date(utcMs),
    policyType: "STANDARD",
    cancellationPolicyVersion: CANCELLATION_POLICY_VERSION,
    refundSchedule: JSON.stringify({
      type: "STANDARD",
      freeCancelEndsAtUtcMs: utcMs,
      daysBeforeCheckIn: days,
      note: "Full refund until this time (KST).",
    }),
  };
}

export function formatUsdFromCents(amountUsd: number) {
  return `$${(amountUsd / 100).toFixed(2)} USD`;
}

/** 결제 영수증/인보이스용: 실제 결제한 통화·금액 포맷 (USD=센트, KRW/JPY=정수) */
export function formatPaymentAmount(
  paymentCurrency: "USD" | "KRW" | "JPY",
  paymentAmount: number
): string {
  if (paymentCurrency === "USD") {
    return `$${(paymentAmount / 100).toFixed(2)} USD`;
  }
  if (paymentCurrency === "KRW") {
    return `₩${paymentAmount.toLocaleString("ko-KR")} KRW`;
  }
  if (paymentCurrency === "JPY") {
    return `¥${paymentAmount.toLocaleString("ja-JP")} JPY`;
  }
  return `${paymentAmount} ${paymentCurrency}`;
}

/** 현지 통화 소수 자리: JPY/VND/IDR/KRW 정수, 나머지 2자리 (policy·표시 규칙과 동일) */
function localCurrencyDecimals(currency: Currency): number {
  return currency === "JPY" || currency === "VND" || currency === "IDR" || currency === "KRW" ? 0 : 2;
}

/**
 * 영수증 병기용: totalKrw를 게스트 선택 통화로 환산해 "Approx. XXX [Currency]" 포맷.
 * 반올림 규칙 적용(JPY/IDR/VND/KRW 정수, 그 외 2자리).
 */
export function formatApproxLocalFromKRW(
  totalKrw: number,
  localCurrency: string | null | undefined
): string | null {
  if (!localCurrency || typeof localCurrency !== "string") return null;
  const key = localCurrency.trim().toUpperCase().slice(0, 3) as Currency;
  const per = KRW_PER[key];
  const symbol = CURRENCY_SYMBOL[key];
  if (per == null || per <= 0 || symbol == null) return null;
  const amount = totalKrw / per;
  const decimals = localCurrencyDecimals(key);
  const rounded = decimals === 0 ? Math.round(amount) : Math.round(amount * 100) / 100;
  const formatted =
    decimals === 0
      ? rounded.toLocaleString("en-US", { maximumFractionDigits: 0 })
      : rounded.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return `Approx. ${symbol}${formatted} ${key}`;
}

/** 영수증 하단 안내 문구 (실제 결제 통화에 맞춤) */
export function getSettlementDisclaimer(paymentCurrency: "USD" | "KRW" | "JPY"): string {
  return `Final settlement is processed in ${paymentCurrency}, and the local currency amount is for reference based on the current exchange rate.`;
}
