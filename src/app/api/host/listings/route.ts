import { getOrCreateServerUser } from "@/lib/auth/server";
import { apiError, apiOk } from "@/lib/api/response";
import { parseJsonBody } from "@/lib/api/validation";
import { createHostListingSchema } from "@/lib/validation/schemas";
import { createPendingHostListing } from "@/lib/repositories/host-listings";

export async function POST(req: Request) {
  try {
    const user = await getOrCreateServerUser();
    if (!user) {
      return apiError(401, "UNAUTHORIZED", "Login required");
    }

    const parsedBody = await parseJsonBody(req, createHostListingSchema);
    if (!parsedBody.ok) return parsedBody.response;
    const body = parsedBody.data;
    const hostBio = body.hostBio || null;
    const hostBioKo = body.hostBioKo || null;
    const hostBioJa = body.hostBioJa || null;
    const hostBioZh = body.hostBioZh || null;
    const listing = await createPendingHostListing({
      userId: user.id,
      userName: user.name,
      isAdmin: user.role === "ADMIN",
      title: body.title,
      city: body.city,
      area: body.area,
      address: body.address,
      basePriceKrw: body.basePriceKrw,
      checkInTime: body.checkInTime,
      hostBio,
      hostBioKo,
      hostBioJa,
      hostBioZh,
    });

    return apiOk(listing, 201);
  } catch (error) {
    console.error("[api/host/listings] failed to create listing", error);
    return apiError(500, "INTERNAL_ERROR", "Failed to create listing");
  }
}
