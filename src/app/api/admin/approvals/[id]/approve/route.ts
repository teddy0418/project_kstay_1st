import { prisma } from "@/lib/db";
import { getServerSessionUser, requireAdminUser } from "@/lib/auth/server";
import { apiError, apiOk } from "@/lib/api/response";

export async function POST(_: Request, ctx: { params: Promise<{ id: string }> }) {
  const sessionUser = await getServerSessionUser();
  if (!sessionUser) return apiError(401, "UNAUTHORIZED", "Login required");

  const admin = await requireAdminUser();
  if (!admin) return apiError(403, "FORBIDDEN", "Admin access required");

  const { id } = await ctx.params;
  if (!id) return apiError(400, "BAD_REQUEST", "listing id is required");

  const current = await prisma.listing.findUnique({
    where: { id },
    select: { id: true, status: true },
  });
  if (!current) return apiError(404, "NOT_FOUND", "Listing not found");

  const listing = await prisma.listing.update({
    where: { id },
    data: { status: "APPROVED", approvedAt: new Date() },
    select: { id: true, status: true, approvedAt: true },
  });

  return apiOk(listing);
}
