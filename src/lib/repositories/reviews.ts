import { prisma } from "@/lib/db";

export async function createReview(params: {
  bookingId: string;
  userId: string;
  listingId: string;
  rating: number;
  body: string;
}) {
  return prisma.review.create({
    data: {
      bookingId: params.bookingId,
      userId: params.userId,
      listingId: params.listingId,
      rating: Math.min(5, Math.max(1, params.rating)),
      body: params.body.trim().slice(0, 2000),
    },
    include: {
      listing: { select: { id: true, title: true, titleKo: true } },
    },
  });
}

export async function findReviewByBookingId(bookingId: string) {
  return prisma.review.findUnique({
    where: { bookingId },
  });
}

export async function findReviewsByListingId(listingId: string, limit = 50) {
  return prisma.review.findMany({
    where: { listingId },
    orderBy: { createdAt: "desc" },
    take: limit,
    include: {
      user: { select: { id: true, name: true, image: true } },
    },
  });
}

export async function findReviewsByUserId(userId: string, limit = 50) {
  return prisma.review.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: limit,
    include: {
      listing: { select: { id: true, title: true, titleKo: true } },
    },
  });
}
