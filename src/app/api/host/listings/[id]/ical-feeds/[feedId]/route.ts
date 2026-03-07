import { apiError, apiOk } from "@/lib/api/response";
import { getOrCreateServerUser } from "@/lib/auth/server";
import { prisma } from "@/lib/db";

/** PATCH: syncEnabled 토글 등 */
export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ id: string; feedId: string }> }
) {
  try {
    const user = await getOrCreateServerUser();
    if (!user) return apiError(401, "UNAUTHORIZED", "Login required");

    const { id: listingId, feedId } = await ctx.params;
    if (!listingId || !feedId) return apiError(400, "BAD_REQUEST", "listing id and feed id are required");

    const feed = await prisma.listingIcalFeed.findFirst({
      where: { id: feedId, listingId },
      select: { id: true, listing: { select: { hostId: true } } },
    });
    if (!feed) return apiError(404, "NOT_FOUND", "Feed not found");
    if (user.role !== "ADMIN" && feed.listing.hostId !== user.id) {
      return apiError(403, "FORBIDDEN", "Not allowed");
    }

    let body: { syncEnabled?: boolean };
    try {
      body = await req.json();
    } catch {
      return apiError(400, "BAD_REQUEST", "Invalid JSON");
    }
    if (typeof body.syncEnabled !== "boolean") {
      return apiError(400, "BAD_REQUEST", "syncEnabled (boolean) required");
    }

    const updated = await prisma.listingIcalFeed.update({
      where: { id: feedId },
      data: { syncEnabled: body.syncEnabled },
      select: { id: true, syncEnabled: true },
    });
    return apiOk({ syncEnabled: updated.syncEnabled });
  } catch (error) {
    console.error("[api/host/listings/:id/ical-feeds/:feedId] PATCH failed", error);
    return apiError(500, "INTERNAL_ERROR", "Failed to update feed");
  }
}

/** DELETE: iCal 피드 삭제 */
export async function DELETE(
  _req: Request,
  ctx: { params: Promise<{ id: string; feedId: string }> }
) {
  try {
    const user = await getOrCreateServerUser();
    if (!user) return apiError(401, "UNAUTHORIZED", "Login required");

    const { id: listingId, feedId } = await ctx.params;
    if (!listingId || !feedId) return apiError(400, "BAD_REQUEST", "listing id and feed id are required");

    const feed = await prisma.listingIcalFeed.findFirst({
      where: { id: feedId, listingId },
      select: { id: true, listing: { select: { hostId: true } } },
    });
    if (!feed) return apiError(404, "NOT_FOUND", "Feed not found");
    if (user.role !== "ADMIN" && feed.listing.hostId !== user.id) {
      return apiError(403, "FORBIDDEN", "Not allowed");
    }

    await prisma.listingIcalFeed.delete({ where: { id: feedId } });
    return apiOk({ deleted: true });
  } catch (error) {
    console.error("[api/host/listings/:id/ical-feeds/:feedId] DELETE failed", error);
    return apiError(500, "INTERNAL_ERROR", "Failed to delete feed");
  }
}
