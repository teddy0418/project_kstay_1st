import { getOrCreateServerUser } from "@/lib/auth/server";
import { apiError, apiOk } from "@/lib/api/response";
import { parseJsonBody } from "@/lib/api/validation";
import { wishlistMutationSchema } from "@/lib/validation/schemas";
import {
  addWishlistItem,
  clearWishlist,
  getWishlistListingIdsByUser,
  listingExistsForWishlist,
} from "@/lib/repositories/wishlist";

export async function GET() {
  try {
    const user = await getOrCreateServerUser();
    if (!user) return apiError(401, "UNAUTHORIZED", "Login required");

    const listingIds = await getWishlistListingIdsByUser(user.id);
    return apiOk(listingIds);
  } catch (error) {
    console.error("[api/wishlist] failed to fetch wishlist", error);
    return apiError(500, "INTERNAL_ERROR", "Failed to fetch wishlist");
  }
}

export async function POST(req: Request) {
  try {
    const user = await getOrCreateServerUser();
    if (!user) return apiError(401, "UNAUTHORIZED", "Login required");

    const parsedBody = await parseJsonBody(req, wishlistMutationSchema);
    if (!parsedBody.ok) return parsedBody.response;
    const listingId = parsedBody.data.listingId;

    const listingExists = await listingExistsForWishlist(listingId);
    if (!listingExists) return apiError(404, "NOT_FOUND", "Listing not found");

    await addWishlistItem(user.id, listingId);

    return apiOk({ listingId }, 201);
  } catch (error) {
    console.error("[api/wishlist] failed to add wishlist item", error);
    return apiError(500, "INTERNAL_ERROR", "Failed to add wishlist item");
  }
}

export async function DELETE() {
  try {
    const user = await getOrCreateServerUser();
    if (!user) return apiError(401, "UNAUTHORIZED", "Login required");

    await clearWishlist(user.id);

    return apiOk({ cleared: true });
  } catch (error) {
    console.error("[api/wishlist] failed to clear wishlist", error);
    return apiError(500, "INTERNAL_ERROR", "Failed to clear wishlist");
  }
}
