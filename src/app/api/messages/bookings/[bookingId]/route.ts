import { NextRequest } from "next/server";
import { apiError, apiOk } from "@/lib/api/response";
import { requireAuthWithDb } from "@/lib/api/auth-guard";
import {
  getMessagesByBookingId,
  createBookingMessage,
  markNotificationsReadByBookingAndUser,
  markBookingMessagesReadByHost,
  isBookingGuest,
  isBookingHost,
} from "@/lib/repositories/booking-messages";

/** GET /api/messages/bookings/[bookingId] — 해당 예약의 메시지 목록. 게스트 또는 해당 숙소 호스트만. */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ bookingId: string }> }
) {
  const auth = await requireAuthWithDb();
  if (!auth.ok) return auth.response;
  const user = auth.user;

  const { bookingId } = await params;
  const isGuest = await isBookingGuest(bookingId, user.id);
  const isHost = await isBookingHost(bookingId, user.id);
  if (!isGuest && !isHost) return apiError(403, "FORBIDDEN", "Not your booking or listing");

  const messages = await getMessagesByBookingId(bookingId);
  if (isGuest) await markNotificationsReadByBookingAndUser(bookingId, user.id);
  if (isHost) await markBookingMessagesReadByHost(bookingId, user.id);

  const list = messages.map((m) => ({
    id: m.id,
    body: m.body,
    senderRole: m.senderRole,
    senderUserId: m.senderUserId,
    senderName: m.sender?.displayName?.trim() || m.sender?.name || "User",
    senderProfilePhotoUrl: m.sender?.profilePhotoUrl ?? null,
    createdAt: m.createdAt.toISOString(),
  }));

  return apiOk({ messages: list });
}

/** POST /api/messages/bookings/[bookingId] — 메시지 작성. body: { body: string }. 호스트 답변 시 게스트에게 알림 생성. */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ bookingId: string }> }
) {
  const auth = await requireAuthWithDb();
  if (!auth.ok) return auth.response;
  const user = auth.user;

  const { bookingId } = await params;
  const isGuest = await isBookingGuest(bookingId, user.id);
  const isHost = await isBookingHost(bookingId, user.id);
  if (!isGuest && !isHost) return apiError(403, "FORBIDDEN", "Not your booking or listing");

  let body: string;
  try {
    const json = await req.json();
    body = typeof json?.body === "string" ? json.body.trim() : "";
  } catch {
    return apiError(400, "BAD_REQUEST", "Invalid JSON or missing body");
  }
  if (!body || body.length > 4000) return apiError(400, "BAD_REQUEST", "Body required (max 4000 chars)");

  const senderRole = isGuest ? ("GUEST" as const) : ("HOST" as const);
  const msg = await createBookingMessage({
    bookingId,
    senderUserId: user.id,
    senderRole,
    body,
  });

  return apiOk({
    id: msg.id,
    body: msg.body,
    senderRole: msg.senderRole,
    createdAt: msg.createdAt.toISOString(),
  }, 201);
}
