import { getPublicListings, getPublicListingsByIds } from "@/lib/repositories/listings";
import { apiOk, apiError } from "@/lib/api/response";

function one(param: string | null): string {
  return param ? param.trim() : "";
}

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

    if (ids.length > 0) {
      const listings = await getPublicListingsByIds(ids);
      return apiOk(listings);
    }

    const where = one(url.searchParams.get("where"));
    const start = one(url.searchParams.get("start"));
    const end = one(url.searchParams.get("end"));
    const filters =
      where || (start && end)
        ? { where: where || undefined, start: start || undefined, end: end || undefined }
        : undefined;

    const listings = await getPublicListings(filters);
    return apiOk(listings);
  } catch {
    return apiError(500, "INTERNAL_ERROR", "Failed to fetch listings");
  }
}
