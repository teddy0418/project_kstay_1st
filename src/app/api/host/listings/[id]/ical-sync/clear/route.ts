import { apiError, apiOk } from "@/lib/api/response";
import { getOrCreateServerUser } from "@/lib/auth/server";
import { prisma } from "@/lib/db";

/**
 * POST: URL은 유지하고, iCal 동기화로 생긴 막힘 날짜만 지웁니다.
 * (ListingIcalBlockedDate 삭제, lastSyncedAt 초기화)
 */
export async function POST(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const user = await getOrCreateServerUser();
    if (!user) return apiError(401, "UNAUTHORIZED", "Login required");

    const { id: listingId } = await ctx.params;
    if (!listingId) return apiError(400, "BAD_REQUEST", "listing id is required");

    const listing = await prisma.listing.findFirst({
      where: {
        id: listingId,
        ...(user.role === "ADMIN" ? {} : { hostId: user.id }),
      },
      select: { id: true, status: true },
    });
    if (!listing) return apiError(404, "NOT_FOUND", "Listing not found");
    const isDraftOwnedByGuest = user.role === "GUEST" && listing.status === "DRAFT";
    if (user.role !== "HOST" && user.role !== "ADMIN" && !isDraftOwnedByGuest) {
      return apiError(403, "FORBIDDEN", "Host role required");
    }

    await prisma.$transaction(async (tx) => {
      await tx.listingIcalBlockedDate.deleteMany({ where: { listingId } });
      await tx.listing.update({
        where: { id: listingId },
        data: { icalLastSyncedAt: null },
      });
      await tx.listingIcalFeed.updateMany({
        where: { listingId },
        data: { lastSyncedAt: null, lastSyncStatus: null },
      });
    });

    return apiOk({ ok: true });
  } catch (error) {
    console.error("[api/host/listings/:id/ical-sync/clear] failed", error);
    return apiError(500, "INTERNAL_ERROR", "동기화 결과 지우기에 실패했습니다.");
  }
}
