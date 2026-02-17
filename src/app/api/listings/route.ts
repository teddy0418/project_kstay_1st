import { getPublicListings } from "@/lib/repositories/listings";
import { apiOk, apiError } from "@/lib/api/response";

export async function GET() {
  try {
    const listings = await getPublicListings();
    return apiOk(listings);
  } catch {
    return apiError(500, "INTERNAL_ERROR", "Failed to fetch listings");
  }
}
