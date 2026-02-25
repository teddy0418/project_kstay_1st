// ---- Pricing Policy (MVP) ----
// Guest-facing display price must be FINAL (VAT included).
// UI에서 표시할 때 이 값 사용: GUEST_SERVICE_FEE_DISPLAY_PCT

export const GUEST_SERVICE_FEE_NET_RATE = 0.12; // 12%
export const GUEST_SERVICE_FEE_DISPLAY_PCT = 12; // UI 표시용 (예: "게스트 서비스 수수료 (12%)")
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

/** 환불 불가 특가: 게스트 할인율 (10%) */
export const NON_REFUNDABLE_DISCOUNT_RATE = 0.1;

// ---- End Pricing Policy ----

/** 표준: 체크인 N일 전 23:59 KST까지 무료 취소 (기본 5일) */
export const FREE_CANCELLATION_DAYS = 5;
export const HOST_DECISION_HOURS = 24; // Host can decline within 24h (then void/refund)

/** 환불 불가 특가: 예약 후 24h(KST)까지만 환불. 체크인 48h 미만 남으면 그레이스 없음(바로 환불 불가) */
export const NON_REFUNDABLE_GRACE_HOURS = 24;
export const NON_REFUNDABLE_MIN_CHECKIN_HOURS = 48; // 체크인까지 48h 미만 = 초임박 → 바로 환불 불가

const KST_OFFSET_MS = 9 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;
const HOUR_MS = 60 * 60 * 1000;

/** 표준 정책: 체크인 N일 전 23:59:59 KST (UTC ms). days 기본값 5 */
export function freeCancellationDeadlineUtcMs(checkInDateISO: string, days: number = FREE_CANCELLATION_DAYS) {
  const [y, m, d] = checkInDateISO.split("-").map(Number);
  const checkInKstMidnightUtcMs = Date.UTC(y, (m ?? 1) - 1, d ?? 1) - KST_OFFSET_MS;
  const cutoffUtcMs = checkInKstMidnightUtcMs - days * DAY_MS;
  return cutoffUtcMs - 60 * 1000; // 23:59:59
}

/** 환불 불가 특가: 무료 취소 마감 시각(UTC ms). 초임박(체크인 48h 미만)이면 예약 시각=이미 지남 → 환불 불가 */
export function nonRefundableFreeCancelEndsAtUtcMs(bookingCreatedAtUtcMs: number, checkInDateISO: string): number {
  const [y, m, d] = checkInDateISO.split("-").map(Number);
  const checkInStartUtcMs = Date.UTC(y, (m ?? 1) - 1, d ?? 1);
  const hoursToCheckIn = (checkInStartUtcMs - bookingCreatedAtUtcMs) / HOUR_MS;
  if (hoursToCheckIn < NON_REFUNDABLE_MIN_CHECKIN_HOURS) {
    return bookingCreatedAtUtcMs; // 이미 지난 시각 → 바로 환불 불가
  }
  return bookingCreatedAtUtcMs + NON_REFUNDABLE_GRACE_HOURS * HOUR_MS;
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

/** 게스트 로컬 시간 표시용 (KST + 로컬 동시 표기 시 사용) */
export function formatLocalDateTimeFromUtcMs(utcMs: number, locale = "en-US", timeZone?: string) {
  const dt = new Date(utcMs);
  const tz = timeZone ?? Intl.DateTimeFormat().resolvedOptions().timeZone;
  const fmt = new Intl.DateTimeFormat(locale, {
    timeZone: tz,
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  return `${fmt.format(dt)} (${tz})`;
}

export function isCancellationAllowedNow(checkInDateISO: string, nowMs = Date.now(), days = FREE_CANCELLATION_DAYS) {
  const deadline = freeCancellationDeadlineUtcMs(checkInDateISO, days);
  return nowMs <= deadline;
}
