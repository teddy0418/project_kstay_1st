import { getPublicListingById } from "@/lib/repositories/listings";
import { apiOk, apiError } from "@/lib/api/response";

export async function GET(_: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const listing = await getPublicListingById(id);
  if (!listing) {
    return apiError(404, "NOT_FOUND", "Listing not found");
  }
  return apiOk(listing);
}
