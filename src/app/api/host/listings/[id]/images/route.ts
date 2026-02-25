import { getOrCreateServerUser } from "@/lib/auth/server";
import { apiError, apiOk } from "@/lib/api/response";
import { parseJsonBody } from "@/lib/api/validation";
import { addListingImageSchema } from "@/lib/validation/schemas";
import { findHostListingOwnership, addListingImage, countListingImages } from "@/lib/repositories/host-listings";

export async function POST(
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

    const parsed = await parseJsonBody(req, addListingImageSchema);
    if (!parsed.ok) return parsed.response;
    const { url, sortOrder } = parsed.data;

    const currentCount = await countListingImages(listingId);
    if (currentCount >= 20) {
      return apiError(400, "VALIDATION_ERROR", "이미지는 최대 20장까지 등록할 수 있습니다.");
    }

    const image = await addListingImage(listingId, url, sortOrder);
    return apiOk(image, 201);
  } catch (error) {
    console.error("[api/host/listings/:id/images] POST failed", error);
    return apiError(500, "INTERNAL_ERROR", "Failed to add image");
  }
}
