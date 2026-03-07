import { prisma } from "@/lib/db";
import { getOrCreateServerUser } from "@/lib/auth/server";
import { apiError, apiOk } from "@/lib/api/response";

/** POST: 호스트가 예약 확정(CONFIRMED) 건을 취소. 결제 상태도 CANCELLED로 변경. (PG 환불은 별도 연동) */
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
    select: { id: true, status: true, payments: { where: { status: "PAID" }, select: { id: true } } },
  });
  if (!booking) return apiError(404, "NOT_FOUND", "Booking not found");
  if (booking.status !== "CONFIRMED") {
    return apiError(400, "BAD_REQUEST", "예약 확정 상태의 예약만 취소할 수 있습니다.");
  }

  await prisma.$transaction(async (tx) => {
    await tx.booking.update({
      where: { id: bookingId },
      data: { status: "CANCELLED", cancelledBy: "HOST" },
    });
    for (const p of booking.payments) {
      await tx.payment.update({
        where: { id: p.id },
        data: { status: "CANCELLED" },
      });
    }
  });

  return apiOk({ ok: true });
}
