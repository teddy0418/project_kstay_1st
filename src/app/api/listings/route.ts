import { getPublicListings, getPublicListingsByIds } from "@/lib/repositories/listings";
import { apiOk, apiError } from "@/lib/api/response";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const idsParam = url.searchParams.get("ids");
    const ids = idsParam
      ? idsParam
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean)
      : [];
    const listings = ids.length > 0 ? await getPublicListingsByIds(ids) : await getPublicListings();
    return apiOk(listings);
  } catch {
    return apiError(500, "INTERNAL_ERROR", "Failed to fetch listings");
  }
}
