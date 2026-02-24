import { prisma } from "@/lib/db";
import { apiError, apiOk } from "@/lib/api/response";

export type UnavailableDatesResponse = {
  ranges: Array<{ from: string; to: string }>;
};

/**
 * GET /api/listings/[id]/unavailable-dates
 * Returns date ranges: CONFIRMED 예약 + 호스트가 판매 중지(Block)한 날짜.
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: listingId } = await params;
    if (!listingId) return apiError(400, "BAD_REQUEST", "Listing ID required");

    const [bookings, blocked] = await Promise.all([
      prisma.booking.findMany({
        where: { listingId, status: "CONFIRMED" },
        select: { checkIn: true, checkOut: true },
      }),
      prisma.listingBlockedDate.findMany({
        where: { listingId },
        select: { date: true },
      }),
    ]);

    const ranges: Array<{ from: string; to: string }> = bookings.map((b) => ({
      from: b.checkIn.toISOString().slice(0, 10),
      to: b.checkOut.toISOString().slice(0, 10),
    }));

    blocked.forEach((b) => {
      const d = b.date.toISOString().slice(0, 10);
      ranges.push({ from: d, to: d });
    });

    return apiOk<UnavailableDatesResponse>({ ranges });
  } catch (error) {
    console.error("[api/listings/[id]/unavailable-dates] GET failed", error);
    return apiError(500, "INTERNAL_ERROR", "Failed to fetch unavailable dates");
  }
}
