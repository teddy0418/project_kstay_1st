import { freeCancellationDeadlineUtcMs, formatKSTDateTimeFromUtcMs } from "@/lib/policy";
import { nightsBetween, formatDateEn } from "@/lib/format";

/** Validates YYYY-MM-DD and returns Date at UTC midnight, or null. */
export function parseISODate(raw: unknown): Date | null {
  const s = String(raw ?? "");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return null;
  const d = new Date(`${s}T00:00:00.000Z`);
  if (Number.isNaN(d.getTime())) return null;
  return d;
}

export { nightsBetween, formatDateEn };

export function buildCancellationDeadlineKst(checkInISO: string) {
  const utcMs = freeCancellationDeadlineUtcMs(checkInISO);
  return new Date(utcMs);
}

export function formatCancellationDeadlineKst(value: Date) {
  return formatKSTDateTimeFromUtcMs(value.getTime());
}

export function formatUsdFromCents(amountUsd: number) {
  return `$${(amountUsd / 100).toFixed(2)} USD`;
}
