import { apiOk } from "@/lib/api/response";
import { requireAuthWithDb } from "@/lib/api/auth-guard";
import { getUnreadNotificationCount, getNotificationsByUserId } from "@/lib/repositories/booking-messages";

/** GET /api/notifications — 내 알림 목록 + 미읽음 개수. */
export async function GET() {
  const auth = await requireAuthWithDb();
  if (!auth.ok) return auth.response;
  const user = auth.user;

  const [unreadCount, list] = await Promise.all([
    getUnreadNotificationCount(user.id),
    getNotificationsByUserId(user.id, 50),
  ]);

  const items = list.map((n) => ({
    id: n.id,
    type: n.type,
    bookingId: n.bookingId ?? null,
    messageId: n.messageId ?? null,
    supportTicketId: n.supportTicketId ?? null,
    supportMessageId: n.supportMessageId ?? null,
    readAt: n.readAt?.toISOString() ?? null,
    createdAt: n.createdAt.toISOString(),
  }));

  return apiOk({ unreadCount, notifications: items });
}
