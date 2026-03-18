import { apiError, apiOk } from "@/lib/api/response";
import { requireAdmin } from "@/lib/api/auth-guard";
import { getLatestPromotionByListing } from "@/lib/repositories/listing-promotions";

export async function GET(req: Request) {
  try {
    const auth = await requireAdmin();
    if (!auth.ok) return auth.response;
    const admin = auth.user;

    const url = new URL(req.url);
    const listingId = url.searchParams.get("listingId") ?? "";
    if (!listingId) return apiError(400, "BAD_REQUEST", "listingId required");

    const promo = await getLatestPromotionByListing(listingId);
    if (!promo) return apiOk({ promotion: null });

    return apiOk({
      promotion: {
        id: promo.id,
        listing: promo.listing,
        placement: promo.placement,
        status: promo.status,
        priority: promo.priority,
        startAt: promo.startAt.toISOString(),
        endAt: promo.endAt.toISOString(),
        amountKrw: promo.amountKrw,
        currency: promo.currency,
        memo: promo.memo,
        createdAt: promo.createdAt.toISOString(),
      },
    });
  } catch (err) {
    console.error("[api/admin/promotions/by-listing] GET failed", err);
    return apiError(500, "INTERNAL_ERROR", "Failed to fetch promotion");
  }
}

