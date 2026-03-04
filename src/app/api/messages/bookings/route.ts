import { apiError, apiOk } from "@/lib/api/response";
import { getOrCreateServerUser } from "@/lib/auth/server";
import {
  findConfirmedBookingsByGuestUserId,
  findConfirmedBookingsByHostId,
  getLastMessageByBookingId,
  getUnreadNotificationCount,
} from "@/lib/repositories/booking-messages";
import { prisma } from "@/lib/db";

/** GET /api/messages/bookings — 내 메시지함(예약 건별 스레드 목록). 게스트는 내 예약, 호스트는 내 숙소 예약. */
export async function GET() {
  const user = await getOrCreateServerUser();
  if (!user) return apiError(401, "UNAUTHORIZED", "Sign in required");

  const isHost = user.role === "HOST";
  const bookings = isHost
    ? await findConfirmedBookingsByHostId(user.id)
    : await findConfirmedBookingsByGuestUserId(user.id);

  const unreadByBooking =
    isHost
      ? new Map<string, number>()
      : await (async () => {
          const notifs = await prisma.notification.findMany({
            where: { userId: user.id, readAt: null, bookingId: { not: null } },
            select: { bookingId: true },
          });
          const m = new Map<string, number>();
          for (const n of notifs) {
            if (n.bookingId) m.set(n.bookingId, (m.get(n.bookingId) ?? 0) + 1);
          }
          return m;
        })();

  const threads = (
    await Promise.all(
      bookings.map(async (b) => {
        const last = await getLastMessageByBookingId(b.id);
        // 호스트/게스트 간 실제 대화가 한 번도 없으면 메시지함에 노출하지 않음
        if (!last) return null;

        const listingTitle = b.listing?.title ?? "";
        const checkIn = b.checkIn instanceof Date ? b.checkIn.toISOString().slice(0, 10) : "";
        const checkOut = b.checkOut instanceof Date ? b.checkOut.toISOString().slice(0, 10) : "";
        return {
          bookingId: b.id,
          listingTitle,
          checkIn,
          checkOut,
          nights: b.nights,
          lastMessageAt: last.createdAt.toISOString(),
          lastBodyPreview: last.body ? last.body.slice(0, 80) : null,
          unreadCount: unreadByBooking.get(b.id) ?? 0,
        };
      })
    )
  ).filter((t): t is NonNullable<typeof t> => t !== null);

  // 최근 메시지 있는 순으로 정렬
  threads.sort((a, b) => {
    const at = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0;
    const bt = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0;
    return bt - at;
  });

  return apiOk({ threads, role: user.role });
}
