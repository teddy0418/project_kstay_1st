import { apiError, apiOk } from "@/lib/api/response";
import { requireAuthWithDb } from "@/lib/api/auth-guard";
import { removeWishlistItem } from "@/lib/repositories/wishlist";

export async function DELETE(_: Request, ctx: { params: Promise<{ listingId: string }> }) {
  try {
    const auth = await requireAuthWithDb();
    if (!auth.ok) return auth.response;

    const { listingId } = await ctx.params;
    const normalizedListingId = listingId.trim();
    if (!normalizedListingId) return apiError(400, "BAD_REQUEST", "listingId is required");

    await removeWishlistItem(auth.user.id, normalizedListingId);

    return apiOk({ listingId: normalizedListingId });
  } catch (error) {
    console.error("[api/wishlist/:listingId] failed to remove wishlist item", error);
    return apiError(500, "INTERNAL_ERROR", "Failed to remove wishlist item");
  }
}
