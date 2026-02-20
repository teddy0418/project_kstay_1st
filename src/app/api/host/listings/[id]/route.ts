import { getOrCreateServerUser } from "@/lib/auth/server";
import { apiError, apiOk } from "@/lib/api/response";
import { parseJsonBody } from "@/lib/api/validation";
import { updateHostListingSchema } from "@/lib/validation/schemas";
import { findHostListingOwnership, updateHostListing } from "@/lib/repositories/host-listings";

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const user = await getOrCreateServerUser();
    if (!user) return apiError(401, "UNAUTHORIZED", "Login required");
    if (user.role !== "HOST" && user.role !== "ADMIN") {
      return apiError(403, "FORBIDDEN", "Host role required");
    }

    const { id } = await ctx.params;
    if (!id) return apiError(400, "BAD_REQUEST", "listing id is required");

    const current = await findHostListingOwnership(id);
    if (!current) return apiError(404, "NOT_FOUND", "Listing not found");
    if (user.role !== "ADMIN" && current.hostId !== user.id) {
      return apiError(403, "FORBIDDEN", "You cannot modify this listing");
    }

    const parsedBody = await parseJsonBody(req, updateHostListingSchema);
    if (!parsedBody.ok) return parsedBody.response;
    const body = parsedBody.data;
    const title = body.title;
    const city = body.city;
    const area = body.area;
    const address = body.address;
    const hostBio = body.hostBio;
    const hostBioKo = body.hostBioKo;
    const hostBioJa = body.hostBioJa;
    const hostBioZh = body.hostBioZh;

    const updated = await updateHostListing({
      id,
      title,
      city,
      area,
      address,
      basePriceKrw: body.basePriceKrw,
      status: body.status,
      hostBio,
      hostBioKo,
      hostBioJa,
      hostBioZh,
    });

    return apiOk(updated);
  } catch (error) {
    console.error("[api/host/listings/:id] failed to update listing", error);
    return apiError(500, "INTERNAL_ERROR", "Failed to update listing");
  }
}
