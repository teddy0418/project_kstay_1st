import { prisma } from "@/lib/db";
import { getOrCreateServerUser } from "@/lib/auth/server";
import { apiError, apiOk } from "@/lib/api/response";

/** POST: 호스트가 예약 거절 (PENDING_PAYMENT만 가능, 상태를 CANCELLED로) */
export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getOrCreateServerUser();
  if (!user) return apiError(401, "UNAUTHORIZED", "Not logged in");
  const { id: bookingId } = await params;
  if (!bookingId) return apiError(400, "BAD_REQUEST", "Booking ID required");

  const booking = await prisma.booking.findFirst({
    where: { id: bookingId, listing: { hostId: user.id } },
    select: { id: true, status: true },
  });
  if (!booking) return apiError(404, "NOT_FOUND", "Booking not found");
  if (booking.status !== "PENDING_PAYMENT") {
    return apiError(400, "BAD_REQUEST", "결제 대기 상태의 예약만 거절할 수 있습니다.");
  }

  await prisma.booking.update({
    where: { id: bookingId },
    data: { status: "CANCELLED" },
  });
  return apiOk({ ok: true });
}
