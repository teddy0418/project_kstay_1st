export const GUEST_SERVICE_FEE_RATE = 0.1; // Guest fee 10%
export const HOST_FEE_RATE = 0; // Host fee 0%
export const FREE_CANCELLATION_DAYS = 7; // Free cancel until 7 days before check-in (KST)
export const HOST_DECISION_HOURS = 24; // Host can decline within 24h (then void/refund)

const KST_OFFSET_MS = 9 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

export function calcGuestServiceFeeKRW(baseKRW: number) {
  return Math.round(baseKRW * GUEST_SERVICE_FEE_RATE);
}

export function totalGuestPriceKRW(baseKRW: number) {
  return baseKRW + calcGuestServiceFeeKRW(baseKRW);
}

export function freeCancellationDeadlineUtcMs(checkInDateISO: string) {
  const [y, m, d] = checkInDateISO.split("-").map(Number);
  const checkInKstMidnightUtcMs = Date.UTC(y, (m ?? 1) - 1, d ?? 1) - KST_OFFSET_MS;
  const cutoffUtcMs = checkInKstMidnightUtcMs - FREE_CANCELLATION_DAYS * DAY_MS;
  return cutoffUtcMs - 60 * 1000;
}

export function formatKSTDateTimeFromUtcMs(utcMs: number) {
  const dt = new Date(utcMs);
  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  return `${fmt.format(dt)} (KST)`;
}

export function isCancellationAllowedNow(checkInDateISO: string, nowMs = Date.now()) {
  const deadline = freeCancellationDeadlineUtcMs(checkInDateISO);
  return nowMs <= deadline;
}
