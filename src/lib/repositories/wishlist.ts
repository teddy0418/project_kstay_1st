import { prisma } from "@/lib/db";

export async function getWishlistListingIdsByUser(userId: string): Promise<string[]> {
  const rows = await prisma.wishlistItem.findMany({
    where: { userId },
    select: { listingId: true },
    orderBy: { createdAt: "desc" },
  });
  return rows.map((row) => row.listingId);
}

export async function addWishlistItem(userId: string, listingId: string): Promise<void> {
  await prisma.wishlistItem.upsert({
    where: { userId_listingId: { userId, listingId } },
    create: { userId, listingId },
    update: {},
  });
}

export async function removeWishlistItem(userId: string, listingId: string): Promise<void> {
  await prisma.wishlistItem.deleteMany({
    where: { userId, listingId },
  });
}

export async function clearWishlist(userId: string): Promise<void> {
  await prisma.wishlistItem.deleteMany({
    where: { userId },
  });
}

export async function listingExistsForWishlist(listingId: string): Promise<boolean> {
  const row = await prisma.listing.findUnique({
    where: { id: listingId },
    select: { id: true },
  });
  return Boolean(row);
}
