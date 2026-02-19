import { prisma } from "@/lib/db";
import { getOrCreateServerUser } from "@/lib/auth/server";
import { apiError, apiOk } from "@/lib/api/response";

type WishlistBody = {
  listingId?: string;
};

async function getWishlistItemsForUser(userId: string) {
  return prisma.wishlistItem.findMany({
    where: { userId },
    select: { listingId: true },
    orderBy: { createdAt: "desc" },
  });
}

type WishlistItemRow = Awaited<ReturnType<typeof getWishlistItemsForUser>>[number];

export async function GET() {
  const user = await getOrCreateServerUser();
  if (!user) return apiError(401, "UNAUTHORIZED", "Login required");

  const items: WishlistItemRow[] = await getWishlistItemsForUser(user.id);

  return apiOk(items.map((x: WishlistItemRow) => x.listingId));
}

export async function POST(req: Request) {
  const user = await getOrCreateServerUser();
  if (!user) return apiError(401, "UNAUTHORIZED", "Login required");

  const body = (await req.json()) as WishlistBody;
  const listingId = String(body.listingId ?? "").trim();
  if (!listingId) return apiError(400, "BAD_REQUEST", "listingId is required");

  const listing = await prisma.listing.findUnique({
    where: { id: listingId },
    select: { id: true },
  });
  if (!listing) return apiError(404, "NOT_FOUND", "Listing not found");

  await prisma.wishlistItem.upsert({
    where: { userId_listingId: { userId: user.id, listingId } },
    create: { userId: user.id, listingId },
    update: {},
  });

  return apiOk({ listingId }, 201);
}

export async function DELETE() {
  const user = await getOrCreateServerUser();
  if (!user) return apiError(401, "UNAUTHORIZED", "Login required");

  await prisma.wishlistItem.deleteMany({
    where: { userId: user.id },
  });

  return apiOk({ cleared: true });
}
