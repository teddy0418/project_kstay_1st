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
 * Returns date ranges: CONFIRMED 예약만 + 호스트 판매 중지(수동) + iCal 연동 차단일.
 * 결제 완료(CONFIRMED)된 구간만 막음. 결제 대기(PENDING_PAYMENT)는 막지 않아
 * 게스트는 “결제 완료해야만 예약 확정”으로 보이게 함. 호스트 거절 시 CANCELLED 되므로 자동으로 풀림.
 * 차단일은 DB에서 date::text로 읽어 서버 타임존 영향 없이 동일한 YYYY-MM-DD 보장.
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

    const now = new Date();
    const [bookings, holdSessions, manualBlockedYmd, icalBlockedYmd] = await Promise.all([
      prisma.booking.findMany({
        where: { listingId, status: "CONFIRMED" },
        select: { checkIn: true, checkOut: true },
      }),
      prisma.checkoutSession.findMany({
        where: { listingId, expiresAt: { gt: now } },
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

    const bookedRanges: Array<{ from: string; to: string }> = [
      ...bookings.map((b) => ({ from: toYmdUtc(b.checkIn), to: toYmdUtc(b.checkOut) })),
      ...holdSessions.map((s) => ({ from: toYmdUtc(s.checkIn), to: toYmdUtc(s.checkOut) })),
    ];

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
