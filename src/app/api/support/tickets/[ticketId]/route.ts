import { NextRequest } from "next/server";
import { apiError, apiOk } from "@/lib/api/response";
import { getOrCreateServerUser } from "@/lib/auth/server";
import {
  getTicketById,
  isTicketOwner,
  getMessagesByTicketId,
  createSupportMessage,
  markSupportNotificationsReadByTicketAndUser,
  updateTicketStatus,
} from "@/lib/repositories/support-tickets";

/** GET /api/support/tickets/[ticketId] — 티켓 상세 + 메시지. 소유자 또는 관리자만. 열면 SUPPORT_REPLIED 알림 읽음 처리 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ ticketId: string }> }
) {
  const user = await getOrCreateServerUser();
  if (!user) return apiError(401, "UNAUTHORIZED", "Sign in required");

  const { ticketId } = await params;
  const ticket = await getTicketById(ticketId);
  if (!ticket) return apiError(404, "NOT_FOUND", "Ticket not found");

  const isAdmin = user.role === "ADMIN" || user.id === "demo-admin";
  const isOwner = await isTicketOwner(ticketId, user.id);
  if (!isAdmin && !isOwner) return apiError(403, "FORBIDDEN", "Not your ticket");

  const messages = await getMessagesByTicketId(ticketId);
  if (isOwner) await markSupportNotificationsReadByTicketAndUser(ticketId, user.id);

  const list = messages.map((m) => ({
    id: m.id,
    body: m.body,
    senderRole: m.senderRole,
    senderUserId: m.senderUserId,
    senderName: m.sender?.displayName?.trim() || m.sender?.name || "User",
    senderProfilePhotoUrl: m.sender?.profilePhotoUrl ?? null,
    createdAt: m.createdAt.toISOString(),
  }));

  return apiOk({
    ticket: {
      id: ticket.id,
      subject: ticket.subject,
      status: ticket.status,
      createdAt: ticket.createdAt.toISOString(),
      userId: ticket.userId,
      userName: ticket.user?.displayName?.trim() || ticket.user?.name,
      userEmail: ticket.user?.email ?? null,
    },
    messages: list,
    canReply: true,
  });
}

/** POST /api/support/tickets/[ticketId] — 메시지 추가. 소유자는 USER, 관리자는 SUPPORT(답변 시 문의자에게 알림) */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ ticketId: string }> }
) {
  const user = await getOrCreateServerUser();
  if (!user) return apiError(401, "UNAUTHORIZED", "Sign in required");

  const { ticketId } = await params;
  const ticket = await getTicketById(ticketId);
  if (!ticket) return apiError(404, "NOT_FOUND", "Ticket not found");

  const isAdmin = user.role === "ADMIN" || user.id === "demo-admin";
  const isOwner = await isTicketOwner(ticketId, user.id);
  if (!isAdmin && !isOwner) return apiError(403, "FORBIDDEN", "Not your ticket");

  let body: string;
  try {
    const json = await req.json();
    body = typeof json?.body === "string" ? json.body.trim() : "";
  } catch {
    return apiError(400, "BAD_REQUEST", "Invalid JSON or missing body");
  }
  if (!body || body.length > 4000) return apiError(400, "BAD_REQUEST", "Body required (max 4000 chars)");

  const senderRole = isAdmin ? ("SUPPORT" as const) : ("USER" as const);
  const msg = await createSupportMessage({
    ticketId,
    senderUserId: user.id,
    senderRole,
    body,
  });

  return apiOk(
    {
      id: msg.id,
      body: msg.body,
      senderRole: msg.senderRole,
      createdAt: msg.createdAt.toISOString(),
    },
    201
  );
}

const VALID_STATUSES = ["OPEN", "PENDING", "CLOSED"] as const;

/** PATCH /api/support/tickets/[ticketId] — 관리자 전용: 진행 상태 변경. body: { status: "OPEN" | "PENDING" | "CLOSED" } */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ ticketId: string }> }
) {
  const user = await getOrCreateServerUser();
  if (!user) return apiError(401, "UNAUTHORIZED", "Sign in required");

  const isAdmin = user.role === "ADMIN" || user.id === "demo-admin";
  if (!isAdmin) return apiError(403, "FORBIDDEN", "Admin only");

  const { ticketId } = await params;
  const ticket = await getTicketById(ticketId);
  if (!ticket) return apiError(404, "NOT_FOUND", "Ticket not found");

  let status: string;
  try {
    const json = await req.json();
    status = typeof json?.status === "string" ? json.status.toUpperCase() : "";
  } catch {
    return apiError(400, "BAD_REQUEST", "Invalid JSON or missing status");
  }
  if (!VALID_STATUSES.includes(status as (typeof VALID_STATUSES)[number])) {
    return apiError(400, "BAD_REQUEST", "status must be OPEN, PENDING, or CLOSED");
  }

  const updated = await updateTicketStatus(ticketId, status as "OPEN" | "PENDING" | "CLOSED");
  return apiOk({ status: updated.status });
}
