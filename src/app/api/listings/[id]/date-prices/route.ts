import { prisma } from "@/lib/db";
import { apiError, apiOk } from "@/lib/api/response";

export type PublicDatePricesResponse = {
  prices: Array<{ date: string; priceKrw: number }>;
};

/**
 * GET /api/listings/[id]/date-prices?from=YYYY-MM-DD&to=YYYY-MM-DD
 * Public endpoint for guests: returns host-set per-date prices (KRW).
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

    // Read date as text to avoid server timezone shifting YYYY-MM-DD.
    const rows = await prisma.$queryRaw<{ date: string; priceKrw: number }[]>`
      SELECT "date"::text AS date, "priceKrw" AS "priceKrw"
      FROM "ListingDatePrice"
      WHERE "listingId" = ${listingId}
        AND "date"::text >= ${from}
        AND "date"::text <= ${to}
      ORDER BY "date" ASC
    `;

    const prices = (rows ?? [])
      .map((r) => ({ date: (r.date ?? "").slice(0, 10), priceKrw: Number(r.priceKrw) }))
      .filter((p) => /^\d{4}-\d{2}-\d{2}$/.test(p.date) && Number.isFinite(p.priceKrw) && p.priceKrw >= 0);

    const res = apiOk<PublicDatePricesResponse>({ prices });
    res.headers.set("Cache-Control", "no-store, no-cache, must-revalidate");
    return res;
  } catch (error) {
    console.error("[api/listings/[id]/date-prices] GET failed", error);
    return apiError(500, "INTERNAL_ERROR", "Failed to fetch date prices");
  }
}

