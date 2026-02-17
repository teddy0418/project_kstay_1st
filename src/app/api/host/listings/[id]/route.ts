import { prisma } from "@/lib/db";
import { getOrCreateServerUser } from "@/lib/auth/server";
import { apiError, apiOk } from "@/lib/api/response";

type UpdateBody = {
  title?: string;
  city?: string;
  area?: string;
  address?: string;
  basePriceKrw?: number;
  status?: "PENDING" | "APPROVED" | "REJECTED";
};

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const user = await getOrCreateServerUser();
  if (!user) return apiError(401, "UNAUTHORIZED", "Login required");
  if (user.role !== "HOST" && user.role !== "ADMIN") {
    return apiError(403, "FORBIDDEN", "Host role required");
  }

  const { id } = await ctx.params;
  if (!id) return apiError(400, "BAD_REQUEST", "listing id is required");

  const current = await prisma.listing.findUnique({
    where: { id },
    select: { id: true, hostId: true },
  });
  if (!current) return apiError(404, "NOT_FOUND", "Listing not found");
  if (user.role !== "ADMIN" && current.hostId !== user.id) {
    return apiError(403, "FORBIDDEN", "You cannot modify this listing");
  }

  const body = (await req.json()) as UpdateBody;
  const title = body.title?.trim();
  const city = body.city?.trim();
  const area = body.area?.trim();
  const address = body.address?.trim();

  const updated = await prisma.listing.update({
    where: { id },
    data: {
      title: title && title.length >= 2 ? title : undefined,
      city: city && city.length >= 2 ? city : undefined,
      area: area && area.length >= 1 ? area : undefined,
      address: address && address.length >= 5 ? address : undefined,
      basePriceKrw: typeof body.basePriceKrw === "number" && body.basePriceKrw > 0 ? Math.floor(body.basePriceKrw) : undefined,
      status: body.status,
      location: city && area ? `${city} · ${area}` : undefined,
    },
    select: {
      id: true,
      title: true,
      city: true,
      area: true,
      address: true,
      basePriceKrw: true,
      status: true,
    },
  });

  return apiOk(updated);
}
