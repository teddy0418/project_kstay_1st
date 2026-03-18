import { apiError, apiOk } from "@/lib/api/response";
import { requireAdmin } from "@/lib/api/auth-guard";
import { getAdminListingReview } from "@/lib/repositories/admin-listings";

/** GET: 관리자용 숙소 검토 상세 (호스트 정보 + 서류 URL 포함) */
export async function GET(
  _: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAdmin();
    if (!auth.ok) return auth.response;
    const admin = auth.user;

    const { id } = await ctx.params;
    if (!id) return apiError(400, "BAD_REQUEST", "Listing id required");

    const review = await getAdminListingReview(id);
    if (!review) return apiError(404, "NOT_FOUND", "Listing not found");

    return apiOk(review);
  } catch (err) {
    console.error("[api/admin/listings/:id] GET failed", err);
    return apiError(500, "INTERNAL_ERROR", "Failed to fetch listing");
  }
}
