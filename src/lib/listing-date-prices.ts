import { prisma } from "@/lib/db";
import { diffNights } from "@/lib/format";
import { isPeakSeason, isWeekend } from "@/lib/peak-season";

/** from ~ to 사이의 모든 YYYY-MM-DD (from, to 포함) */
function dateRange(from: string, to: string): string[] {
  const out: string[] = [];
  const [y0, m0, d0] = from.split("-").map(Number);
  const [y1, m1, d1] = to.split("-").map(Number);
  const start = new Date(y0, m0 - 1, d0).getTime();
  const end = new Date(y1, m1 - 1, d1).getTime();
  for (let t = start; t <= end; t += 86400 * 1000) {
    const d = new Date(t);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    out.push(`${y}-${m}-${day}`);
  }
  return out;
}

export type DatePrice = { date: string; priceKrw: number };

/**
 * 숙소의 날짜별 1박 요금(KRW) 계산.
 * - ListingDatePrice 오버라이드가 있으면 사용.
 * - 없으면 basePriceKrw + 주말/성수기 할증 적용.
 */
export async function getDatePricesForRange(
  listingId: string,
  from: string,
  to: string
): Promise<DatePrice[]> {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(from) || !/^\d{4}-\d{2}-\d{2}$/.test(to)) return [];

  const listing = await prisma.listing.findUnique({
    where: { id: listingId },
    select: {
      basePriceKrw: true,
      weekendSurchargePct: true,
      peakSurchargePct: true,
    },
  });
  if (!listing) return [];

  const baseKrw = listing.basePriceKrw ?? 0;
  const weekendPct = listing.weekendSurchargePct ?? 0;
  const peakPct = listing.peakSurchargePct ?? 0;

  const overrideRows = await prisma.$queryRaw<{ date: string; priceKrw: number }[]>`
    SELECT "date"::text AS date, "priceKrw" AS "priceKrw"
    FROM "ListingDatePrice"
    WHERE "listingId" = ${listingId}
      AND "date"::text >= ${from}
      AND "date"::text <= ${to}
  `;
  const overrideMap = new Map<string, number>();
  for (const r of overrideRows ?? []) {
    const dateStr = (r.date ?? "").slice(0, 10);
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr) && Number.isFinite(Number(r.priceKrw)))
      overrideMap.set(dateStr, Math.max(0, Number(r.priceKrw)));
  }

  const dates = dateRange(from, to);
  const prices: DatePrice[] = [];
  for (const ymd of dates) {
    const override = overrideMap.get(ymd);
    if (override != null) {
      prices.push({ date: ymd, priceKrw: override });
      continue;
    }
    let mult = 1;
    if (weekendPct > 0 && isWeekend(ymd)) mult += weekendPct / 100;
    if (peakPct > 0 && isPeakSeason(ymd)) mult += peakPct / 100;
    const priceKrw = Math.max(0, Math.round(baseKrw * mult));
    prices.push({ date: ymd, priceKrw });
  }
  return prices;
}

/** 체크인(checkIn)~체크아웃(checkOut) 구간의 숙박 기본 요금 합계. 마지막 숙박일 = checkOut 전일. */
export async function getDateRangeTotalBaseKRW(
  listingId: string,
  checkIn: string,
  checkOut: string
): Promise<number> {
const nights = diffNights(checkIn, checkOut);
  if (nights < 1) return 0;
  const [y, m, d] = checkIn.split("-").map(Number);
  const last = new Date(Date.UTC(y, (m ?? 1) - 1, d ?? 1));
  last.setUTCDate(last.getUTCDate() + (nights - 1));
  const lastNightStr = `${last.getUTCFullYear()}-${String(last.getUTCMonth() + 1).padStart(2, "0")}-${String(last.getUTCDate()).padStart(2, "0")}`;
  const prices = await getDatePricesForRange(listingId, checkIn, lastNightStr);
  return prices.reduce((sum, p) => sum + p.priceKrw, 0);
}
