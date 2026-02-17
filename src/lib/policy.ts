// ---- Pricing Policy (MVP) ----
// Guest-facing display price must be FINAL (VAT included).

export const GUEST_SERVICE_FEE_NET_RATE = 0.12; // 12%
export const VAT_RATE = 0.1; // 10%
export const DISPLAY_PRICE_INCLUDES_VAT = true;

// Guest-facing markup (GROSS): 12% + VAT on that 12% = 13.2%
export const GUEST_SERVICE_FEE_RATE = 0.132;
export const GUEST_FEE_RATE = GUEST_SERVICE_FEE_RATE;
export const HOST_FEE_RATE = 0;

export function calcGuestPriceBreakdownKRW(baseKRW: number) {
  const base = Math.max(0, Math.round(baseKRW));
  const serviceFeeNet = Math.round(base * GUEST_SERVICE_FEE_NET_RATE);
  const vat = Math.round(serviceFeeNet * VAT_RATE);
  const serviceFeeGross = serviceFeeNet + vat;
  const total = base + serviceFeeGross;
  return { base, serviceFeeNet, vat, serviceFeeGross, total };
}

export function calcGuestDisplayTotalKRW(baseKRW: number) {
  return calcGuestPriceBreakdownKRW(baseKRW).total;
}

export function calcGuestServiceFeeKRW(baseKRW: number) {
  return calcGuestPriceBreakdownKRW(baseKRW).serviceFeeGross;
}

export function totalGuestPriceKRW(baseKRW: number) {
  return calcGuestDisplayTotalKRW(baseKRW);
}

// ---- End Pricing Policy ----

export const FREE_CANCELLATION_DAYS = 7; // Free cancel until 7 days before check-in (KST)
export const HOST_DECISION_HOURS = 24; // Host can decline within 24h (then void/refund)

const KST_OFFSET_MS = 9 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

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
