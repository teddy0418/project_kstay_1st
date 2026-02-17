import { freeCancellationDeadlineUtcMs, formatKSTDateTimeFromUtcMs } from "@/lib/policy";

export function parseISODate(raw: unknown): Date | null {
  const s = String(raw ?? "");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return null;
  const d = new Date(`${s}T00:00:00.000Z`);
  if (Number.isNaN(d.getTime())) return null;
  return d;
}

export function nightsBetween(checkIn: Date, checkOut: Date) {
  const ms = checkOut.getTime() - checkIn.getTime();
  return Math.max(0, Math.round(ms / 86400000));
}

export function buildCancellationDeadlineKst(checkInISO: string) {
  const utcMs = freeCancellationDeadlineUtcMs(checkInISO);
  return new Date(utcMs);
}

export function formatDateEn(value: Date | string) {
  const d = typeof value === "string" ? new Date(value) : value;
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(d);
}

export function formatCancellationDeadlineKst(value: Date) {
  return formatKSTDateTimeFromUtcMs(value.getTime());
}

export function formatUsdFromCents(amountUsd: number) {
  return `$${(amountUsd / 100).toFixed(2)} USD`;
}
