import { apiError, apiOk } from "@/lib/api/response";
import { getOrCreateServerUser } from "@/lib/auth/server";
import { prisma } from "@/lib/db";
import { performListingIcalSync } from "@/lib/ical-sync";

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
      select: { id: true, hostId: true, status: true },
    });
    if (!listing) return apiError(404, "NOT_FOUND", "Listing not found");
    const isDraftOwnedByGuest = user.role === "GUEST" && listing.status === "DRAFT";
    if (user.role !== "HOST" && user.role !== "ADMIN" && !isDraftOwnedByGuest) {
      return apiError(403, "FORBIDDEN", "Host role required");
    }

    const result = await performListingIcalSync(listingId);
    if (!result.ok) {
      return apiError(400, "BAD_REQUEST", result.error ?? "iCal URL을 하나 이상 등록한 뒤 동기화해 주세요.");
    }
    return apiOk({ ok: true });
  } catch (error) {
    console.error("[api/host/listings/:id/ical-sync] failed", error);
    const message = error instanceof Error ? error.message : "Failed to sync iCal";
    return apiError(500, "INTERNAL_ERROR", message);
  }
}
