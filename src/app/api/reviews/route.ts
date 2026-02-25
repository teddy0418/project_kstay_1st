import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { apiError, apiOk } from "@/lib/api/response";
import { parseJsonBody } from "@/lib/api/validation";
import { getServerSessionUser } from "@/lib/auth/server";
import { createReviewSchema } from "@/lib/validation/schemas";
import { createReview, findReviewsByUserId } from "@/lib/repositories/reviews";

/** POST: 리뷰 작성. 본인 예약(CONFIRMED, 체크아웃 완료)에만 가능, 예약당 1회. */
export async function POST(req: NextRequest) {
  try {
    const user = await getServerSessionUser();
    if (!user) return apiError(401, "UNAUTHORIZED", "Login required");

    const parsed = await parseJsonBody(req, createReviewSchema);
    if (!parsed.ok) return parsed.response;
    const { bookingId, body, cleanliness, accuracy, checkIn, communication, location, value } = parsed.data;

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      select: { id: true, guestUserId: true, listingId: true, status: true, checkOut: true },
    });
    if (!booking) return apiError(404, "NOT_FOUND", "Booking not found");
    if (booking.guestUserId !== user.id) return apiError(403, "FORBIDDEN", "Not your booking");
    if (booking.status !== "CONFIRMED") return apiError(400, "BAD_REQUEST", "Only confirmed bookings can be reviewed");

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    if (booking.checkOut >= startOfToday) return apiError(400, "BAD_REQUEST", "Can review after checkout");

    const existing = await prisma.review.findUnique({ where: { bookingId } });
    if (existing) return apiError(409, "CONFLICT", "Already reviewed this stay");

    const review = await createReview({
      bookingId,
      userId: user.id,
      listingId: booking.listingId,
      body,
      cleanliness,
      accuracy,
      checkIn,
      communication,
      location,
      value,
    });
    return apiOk({ id: review.id, rating: review.rating, body: review.body, createdAt: review.createdAt }, 201);
  } catch (error) {
    console.error("[api/reviews] POST failed", error);
    return apiError(500, "INTERNAL_ERROR", "Failed to create review");
  }
}

/** GET: 내가 쓴 리뷰 목록 (프로필 Your reviews용). */
// eslint-disable-next-line @typescript-eslint/no-unused-vars -- Route handler signature
export async function GET(_req: NextRequest) {
  try {
    const user = await getServerSessionUser();
    if (!user) return apiError(401, "UNAUTHORIZED", "Login required");

    const list = await findReviewsByUserId(user.id);
    const reviews = list.map((r) => ({
      id: r.id,
      rating: r.rating,
      body: r.body,
      createdAt: r.createdAt.toISOString(),
      listing: r.listing
        ? { id: r.listing.id, title: r.listing.title ?? undefined, titleKo: r.listing.titleKo ?? undefined }
        : null,
    }));
    return apiOk({ reviews });
  } catch (error) {
    console.error("[api/reviews] GET failed", error);
    return apiError(500, "INTERNAL_ERROR", "Failed to load reviews");
  }
}
