import { prisma } from "@/lib/db";
import { apiError, apiOk } from "@/lib/api/response";
import { getDatePricesForRange } from "@/lib/listing-date-prices";

export type PublicDatePricesResponse = {
  prices: Array<{ date: string; priceKrw: number }>;
};

/**
 * GET /api/listings/[id]/date-prices?from=YYYY-MM-DD&to=YYYY-MM-DD
 * Public endpoint for guests: returns per-date prices (KRW).
 * - 호스트가 설정한 날짜별 가격(ListingDatePrice)이 있으면 그대로 사용.
 * - 없으면 기본가(basePriceKrw)에 주말/성수기 할증을 적용한 금액 반영.
 */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: listingId } = await params;
    if (!listingId) return apiError(400, "BAD_REQUEST", "Listing ID required");

    const url = new URL(_req.url);
    const from = url.searchParams.get("from") ?? "";
    const to = url.searchParams.get("to") ?? "";
    if (!/^\d{4}-\d{2}-\d{2}$/.test(from) || !/^\d{4}-\d{2}-\d{2}$/.test(to)) {
      return apiError(400, "BAD_REQUEST", "from and to (YYYY-MM-DD) required");
    }

    const exists = await prisma.listing.findUnique({ where: { id: listingId }, select: { id: true } });
    if (!exists) return apiError(404, "NOT_FOUND", "Listing not found");

    const prices = await getDatePricesForRange(listingId, from, to);
    const res = apiOk<PublicDatePricesResponse>({ prices });
    res.headers.set("Cache-Control", "no-store, no-cache, must-revalidate");
    return res;
  } catch (error) {
    console.error("[api/listings/[id]/date-prices] GET failed", error);
    return apiError(500, "INTERNAL_ERROR", "Failed to fetch date prices");
  }
}

