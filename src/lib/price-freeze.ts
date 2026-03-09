/**
 * Price Freeze (가이드라인): 게스트가 숙소 상세를 본 시점의 가격을 30분간 세션에 고정.
 * DB는 항상 KRW; 고정하는 것도 totalKRW.
 */

const STORAGE_KEY = "kstay_frozen_quote";
const FREEZE_TTL_MS = 30 * 60 * 1000; // 30분

export type FrozenQuote = {
  listingId: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  totalKRW: number;
  quotedAt: number;
};

export function setFrozenQuote(payload: Omit<FrozenQuote, "quotedAt">): void {
  if (typeof window === "undefined") return;
  const data: FrozenQuote = { ...payload, quotedAt: Date.now() };
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // ignore
  }
}

export function getFrozenQuote(params: {
  listingId: string;
  checkIn: string;
  checkOut: string;
  guests: number;
}): { totalKRW: number } | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as FrozenQuote;
    if (data.quotedAt + FREEZE_TTL_MS < Date.now()) return null;
    if (
      data.listingId !== params.listingId ||
      data.checkIn !== params.checkIn ||
      data.checkOut !== params.checkOut ||
      data.guests !== params.guests
    )
      return null;
    return { totalKRW: data.totalKRW };
  } catch {
    return null;
  }
}

export function clearFrozenQuote(): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}
