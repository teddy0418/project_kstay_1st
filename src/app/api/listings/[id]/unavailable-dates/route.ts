import { prisma } from "@/lib/db";
import { apiError, apiOk } from "@/lib/api/response";

export type UnavailableDatesResponse = {
  ranges: Array<{ from: string; to: string }>;
  /** 예약된 구간 (체크인~체크아웃) — 캘린더에서 "예약됨" 스타일 */
  bookedRanges: Array<{ from: string; to: string }>;
  /** 판매 중지된 날짜 구간 — 캘린더에서 "판매중지" 스타일 */
  blockedRanges: Array<{ from: string; to: string }>;
};

/**
 * GET /api/listings/[id]/unavailable-dates
 * Returns date ranges: CONFIRMED 예약 + 호스트 판매 중지(수동) + iCal 연동 차단일.
 * 차단일은 DB에서 date::text로 읽어 서버 타임존 영향 없이 동일한 YYYY-MM-DD 보장.
 *
 * 플랫폼 룰: 선택 불가(ranges)에는 예약된 구간 + 실제 판매중지일만 포함.
 * (블록 직전/직후 날은 판매중지가 아니므로 캘린더에서 선택 가능. 2/28·3/4 선택 가능.
 * 체크인·체크아웃 구간이 판매중지일을 포함하면 예약 시 overlapsDisabled로 막힘)
 */
function nextDayYmd(ymd: string): string {
  const dt = new Date(ymd + "T00:00:00Z");
  dt.setUTCDate(dt.getUTCDate() + 1);
  const y = dt.getUTCFullYear();
  const m = String(dt.getUTCMonth() + 1).padStart(2, "0");
  const day = String(dt.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: listingId } = await params;
    if (!listingId) return apiError(400, "BAD_REQUEST", "Listing ID required");

    const [bookings, manualBlockedYmd, icalBlockedYmd] = await Promise.all([
      prisma.booking.findMany({
        where: { listingId, status: "CONFIRMED" },
        select: { checkIn: true, checkOut: true },
      }),
      prisma.$queryRaw<{ date: string }[]>`
        SELECT "date"::text AS date FROM "ListingBlockedDate" WHERE "listingId" = ${listingId}
      `,
      prisma.$queryRaw<{ date: string }[]>`SELECT "date"::text AS date FROM "ListingIcalBlockedDate" WHERE "listingId" = ${listingId}`.catch(
        () => [] as { date: string }[]
      ),
    ]);

    const toYmdUtc = (d: Date) => {
      const y = d.getUTCFullYear();
      const m = String(d.getUTCMonth() + 1).padStart(2, "0");
      const day = String(d.getUTCDate()).padStart(2, "0");
      return `${y}-${m}-${day}`;
    };

    const bookedRanges: Array<{ from: string; to: string }> = bookings.map((b) => ({
      from: toYmdUtc(b.checkIn),
      to: toYmdUtc(b.checkOut),
    }));

    const allBlockedYmd = [...manualBlockedYmd, ...icalBlockedYmd]
      .map((r) => (r.date && r.date.slice(0, 10)) || "")
      .filter((d) => /^\d{4}-\d{2}-\d{2}$/.test(d));
    const blockedRangesSingle: Array<{ from: string; to: string }> = allBlockedYmd.map((d) => ({ from: d, to: nextDayYmd(d) }));

    const ranges = [...bookedRanges, ...blockedRangesSingle];
    const res = apiOk<UnavailableDatesResponse>({ ranges, bookedRanges, blockedRanges: blockedRangesSingle });
    res.headers.set("Cache-Control", "no-store, no-cache, must-revalidate");
    return res;
  } catch (error) {
    console.error("[api/listings/[id]/unavailable-dates] GET failed", error);
    return apiError(500, "INTERNAL_ERROR", "Failed to fetch unavailable dates");
  }
}
