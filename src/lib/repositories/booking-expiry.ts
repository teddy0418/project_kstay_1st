import type { PrismaClient } from "@prisma/client";

/** 24시간 지난 PENDING_PAYMENT를 CANCELLED로 변경. 반환: 만료된 건수 */
export async function expirePendingBookingsOlderThanHours(
  prisma: PrismaClient,
  hours: number
): Promise<number> {
  const expireBefore = new Date();
  expireBefore.setHours(expireBefore.getHours() - hours);

  const result = await prisma.booking.updateMany({
    where: {
      status: "PENDING_PAYMENT",
      createdAt: { lt: expireBefore },
    },
    data: { status: "CANCELLED" },
  });
  return result.count;
}
