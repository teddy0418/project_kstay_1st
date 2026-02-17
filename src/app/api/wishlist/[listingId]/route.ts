import { prisma } from "@/lib/db";
import { getOrCreateServerUser } from "@/lib/auth/server";
import { apiError, apiOk } from "@/lib/api/response";

export async function DELETE(_: Request, ctx: { params: Promise<{ listingId: string }> }) {
  const user = await getOrCreateServerUser();
  if (!user) return apiError(401, "UNAUTHORIZED", "Login required");

  const { listingId } = await ctx.params;
  if (!listingId) return apiError(400, "BAD_REQUEST", "listingId is required");

  await prisma.wishlistItem.deleteMany({
    where: { userId: user.id, listingId },
  });

  return apiOk({ listingId });
}
