import {
  freeCancellationDeadlineUtcMs,
  nonRefundableFreeCancelEndsAtUtcMs,
  formatKSTDateTimeFromUtcMs,
  FREE_CANCELLATION_DAYS,
} from "@/lib/policy";
import { nightsBetween, formatDateEn } from "@/lib/format";

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
