import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { apiError, apiOk } from "@/lib/api/response";
import { parseJsonBody } from "@/lib/api/validation";
import { requireAdminUser } from "@/lib/auth/server";
import { adminCreateReviewSchema } from "@/lib/validation/schemas";
import { createReview } from "@/lib/repositories/reviews";
import { randomBytes } from "crypto";

/**
 * POST /api/admin/reviews
 * 관리자 전용: 지정한 숙소에 테스트 리뷰 1개를 남깁니다.
 * 테스트용 CONFIRMED 예약을 자동 생성한 뒤, 그 예약에 리뷰를 연결합니다.
 * Body: { listingId, body, cleanliness, accuracy, checkIn, communication, location, value }
 */
export async function POST(req: NextRequest) {
  try {
    const admin = await requireAdminUser();
    if (!admin) return apiError(403, "FORBIDDEN", "Admin access required");

    const parsed = await parseJsonBody(req, adminCreateReviewSchema);
    if (!parsed.ok) return parsed.response;
    const { listingId, body, cleanliness, accuracy, checkIn, communication, location, value } =
      parsed.data;

    const listing = await prisma.listing.findFirst({
      where: { id: listingId, status: "APPROVED" },
      select: { id: true },
    });
    if (!listing) return apiError(404, "NOT_FOUND", "Listing not found or not approved");

    const now = new Date();
    const checkOutDate = new Date(now);
    checkOutDate.setDate(checkOutDate.getDate() - 10);
    const checkInDate = new Date(checkOutDate);
    checkInDate.setDate(checkInDate.getDate() - 1);

    const publicToken = `admin-test-${Date.now()}-${randomBytes(6).toString("hex")}`;
    const cancellationDeadlineKst = new Date(checkInDate);
    cancellationDeadlineKst.setDate(cancellationDeadlineKst.getDate() - 7);

    const booking = await prisma.booking.create({
      data: {
        publicToken,
        listingId: listing.id,
        guestUserId: admin.id,
        guestEmail: admin.email ?? "admin@kstay.test",
        guestName: admin.name ?? "Admin",
        checkIn: checkInDate,
        checkOut: checkOutDate,
        nights: 1,
        guestsAdults: 1,
        guestsChildren: 0,
        guestsInfants: 0,
        guestsPets: 0,
        currency: "USD",
        totalUsd: 0,
        totalKrw: 0,
        status: "CONFIRMED",
        confirmedAt: now,
        cancellationDeadlineKst,
      },
      select: { id: true },
    });

    const review = await createReview({
      bookingId: booking.id,
      userId: admin.id,
      listingId: listing.id,
      body,
      cleanliness,
      accuracy,
      checkIn,
      communication,
      location,
      value,
    });

    return apiOk(
      {
        id: review.id,
        listingId: review.listingId,
        rating: review.rating,
        body: review.body,
        createdAt: review.createdAt.toISOString(),
      },
      201
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[api/admin/reviews] POST failed", err);
    return apiError(500, "INTERNAL_ERROR", message);
  }
}
