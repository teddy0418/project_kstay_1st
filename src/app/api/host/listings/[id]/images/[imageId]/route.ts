import { getOrCreateServerUser } from "@/lib/auth/server";
import { apiError, apiOk } from "@/lib/api/response";
import { findHostListingOwnership, deleteListingImage } from "@/lib/repositories/host-listings";

export async function DELETE(
  _req: Request,
  ctx: { params: Promise<{ id: string; imageId: string }> }
) {
  try {
    const user = await getOrCreateServerUser();
    if (!user) return apiError(401, "UNAUTHORIZED", "Login required");
    if (user.role !== "HOST" && user.role !== "ADMIN") {
      return apiError(403, "FORBIDDEN", "Host role required");
    }

    const { id: listingId, imageId } = await ctx.params;
    if (!listingId || !imageId) return apiError(400, "BAD_REQUEST", "listing id and image id required");

    const ownership = await findHostListingOwnership(listingId);
    if (!ownership) return apiError(404, "NOT_FOUND", "Listing not found");
    if (user.role !== "ADMIN" && ownership.hostId !== user.id) {
      return apiError(403, "FORBIDDEN", "You cannot modify this listing");
    }

    const result = await deleteListingImage(imageId, listingId);
    if (result.count === 0) return apiError(404, "NOT_FOUND", "Image not found");
    return apiOk({ deleted: true });
  } catch (error) {
    console.error("[api/host/listings/:id/images/:imageId] DELETE failed", error);
    return apiError(500, "INTERNAL_ERROR", "Failed to delete image");
  }
}
