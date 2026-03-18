import { apiOk } from "@/lib/api/response";
import { apiError } from "@/lib/api/response";
import { parseJsonBody } from "@/lib/api/validation";
import { requireAuthWithDb } from "@/lib/api/auth-guard";
import { wishlistMutationSchema } from "@/lib/validation/schemas";
import {
  addWishlistItem,
  clearWishlist,
  getWishlistListingIdsByUser,
  listingExistsForWishlist,
} from "@/lib/repositories/wishlist";
import { checkRateLimit, RATE_LIMITS, rateLimitResponse, getClientIp } from "@/lib/api/rate-limit";

export async function GET(req: Request) {
  try {
    const auth = await requireAuthWithDb();
    if (!auth.ok) return auth.response;

    const listingIds = await getWishlistListingIdsByUser(auth.user.id);
    return apiOk(listingIds);
  } catch (error) {
    console.error("[api/wishlist] failed to fetch wishlist", error);
    return apiError(500, "INTERNAL_ERROR", "Failed to fetch wishlist");
  }
}

export async function POST(req: Request) {
  try {
    const rl = checkRateLimit(getClientIp(req), RATE_LIMITS.mutation);
    if (!rl.allowed) return rateLimitResponse();

    const auth = await requireAuthWithDb();
    if (!auth.ok) return auth.response;

    const parsedBody = await parseJsonBody(req, wishlistMutationSchema);
    if (!parsedBody.ok) return parsedBody.response;
    const listingId = parsedBody.data.listingId;

    const listingExists = await listingExistsForWishlist(listingId);
    if (!listingExists) return apiError(404, "NOT_FOUND", "Listing not found");

    await addWishlistItem(auth.user.id, listingId);

    return apiOk({ listingId }, 201);
  } catch (error) {
    console.error("[api/wishlist] failed to add wishlist item", error);
    return apiError(500, "INTERNAL_ERROR", "Failed to add wishlist item");
  }
}

export async function DELETE() {
  try {
    const auth = await requireAuthWithDb();
    if (!auth.ok) return auth.response;

    await clearWishlist(auth.user.id);

    return apiOk({ cleared: true });
  } catch (error) {
    console.error("[api/wishlist] failed to clear wishlist", error);
    return apiError(500, "INTERNAL_ERROR", "Failed to clear wishlist");
  }
}
