import { NextRequest } from "next/server";
import { apiError, apiOk } from "@/lib/api/response";
import { findReviewsByListingId } from "@/lib/repositories/reviews";

/** GET: 숙소별 리뷰 목록 (숙소 상세 페이지용). */
export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const { id: listingId } = await ctx.params;
    if (!listingId) return apiError(400, "BAD_REQUEST", "listing id required");

    const rows = await findReviewsByListingId(listingId);
    const reviews = rows.map((r) => ({
      id: r.id,
      rating: r.rating,
      body: r.body,
      createdAt: r.createdAt.toISOString(),
      userName: r.user?.name ?? "Guest",
    }));
    return apiOk({ reviews });
  } catch (error) {
    console.error("[api/listings/[id]/reviews] GET failed", error);
    return apiError(500, "INTERNAL_ERROR", "Failed to load reviews");
  }
}
