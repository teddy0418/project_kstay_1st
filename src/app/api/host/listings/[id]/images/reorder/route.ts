import { getOrCreateServerUser } from "@/lib/auth/server";
import { apiError, apiOk } from "@/lib/api/response";
import { parseJsonBody } from "@/lib/api/validation";
import { reorderListingImagesSchema } from "@/lib/validation/schemas";
import {
  findHostListingOwnership,
  reorderListingImages,
  setListingStatusToPendingIfApproved,
} from "@/lib/repositories/host-listings";

export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getOrCreateServerUser();
    if (!user) return apiError(401, "UNAUTHORIZED", "Login required");
    if (user.role !== "HOST" && user.role !== "ADMIN") {
      return apiError(403, "FORBIDDEN", "Host role required");
    }

    const { id: listingId } = await ctx.params;
    if (!listingId) return apiError(400, "BAD_REQUEST", "listing id is required");

    const ownership = await findHostListingOwnership(listingId);
    if (!ownership) return apiError(404, "NOT_FOUND", "Listing not found");
    if (user.role !== "ADMIN" && ownership.hostId !== user.id) {
      return apiError(403, "FORBIDDEN", "You cannot modify this listing");
    }

    const parsed = await parseJsonBody(req, reorderListingImagesSchema);
    if (!parsed.ok) return parsed.response;

    const images = await reorderListingImages(listingId, parsed.data.imageIds);
    await setListingStatusToPendingIfApproved(listingId);
    return apiOk(images);
  } catch (error) {
    console.error("[api/host/listings/:id/images/reorder] PATCH failed", error);
    return apiError(500, "INTERNAL_ERROR", "Failed to reorder images");
  }
}
