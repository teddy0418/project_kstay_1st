import { NextRequest } from "next/server";
import { apiError, apiOk } from "@/lib/api/response";
import { getOrCreateServerUser } from "@/lib/auth/server";
import {
  findTicketsByUserId,
  findAllTickets,
  getLastMessageByTicketId,
  createTicket,
  getMessagesByTicketId,
} from "@/lib/repositories/support-tickets";
import { prisma } from "@/lib/db";

/** GET /api/support/tickets — 내 티켓 목록(게스트/호스트). 관리자는 전체 목록.
 *  쿼리:
 *    - mineLatestOnly=1: 어떤 역할이든 "내 티켓 중 가장 최근 1개"만 반환
 */
export async function GET(req: NextRequest) {
  const user = await getOrCreateServerUser();
  if (!user) return apiError(401, "UNAUTHORIZED", "Sign in required");

  const mineLatestOnly = req.nextUrl.searchParams.get("mineLatestOnly") === "1";
  const isAdmin = user.role === "ADMIN" || user.id === "demo-admin";
  let tickets = isAdmin ? await findAllTickets() : await findTicketsByUserId(user.id);

  // mineLatestOnly=1 이면, 어떤 역할이든 내 티켓 중 최근 1개만 응답
  if (mineLatestOnly && tickets.length > 1) {
    tickets = tickets.slice(0, 1);
  }

  const unreadByTicket =
    isAdmin
      ? new Map<string, number>()
      : await (async () => {
          const notifs = await prisma.notification.findMany({
            where: {
              userId: user.id,
              readAt: null,
              type: "SUPPORT_REPLIED",
              supportTicketId: { not: null },
            },
            select: { supportTicketId: true },
          });
          const m = new Map<string, number>();
          for (const n of notifs) {
            if (n.supportTicketId) m.set(n.supportTicketId, (m.get(n.supportTicketId) ?? 0) + 1);
          }
          return m;
        })();

  const list = await Promise.all(
    tickets.map(async (t) => {
      const last = await getLastMessageByTicketId(t.id);
      const unreadCount = unreadByTicket.get(t.id) ?? 0;
      const row: Record<string, unknown> = {
        ticketId: t.id,
        subject: t.subject,
        status: t.status,
        createdAt: t.createdAt.toISOString(),
        updatedAt: t.updatedAt.toISOString(),
        lastMessageAt: last?.createdAt?.toISOString() ?? null,
        lastBodyPreview: last?.body ? last.body.slice(0, 80) : null,
        unreadCount,
      };
      if (isAdmin) {
        const user = (t as {
          user?: { displayName?: string | null; name?: string | null; email?: string | null; nationality?: string | null };
        }).user;
        if (user) {
          const display = (user.displayName ?? "").trim();
          row.userName = display || user.name || null;
          row.userEmail = user.email ?? null;
          row.userCountry = user.nationality ?? null;
        }
      }
      return row;
    })
  );

  return apiOk({ tickets: list, isAdmin });
}

/** POST /api/support/tickets — 새 티켓 생성 (첫 메시지 포함). body: { body } */
export async function POST(req: NextRequest) {
  const user = await getOrCreateServerUser();
  if (!user) return apiError(401, "UNAUTHORIZED", "Sign in required");

  let body: string;
  try {
    const json = await req.json();
    body = typeof json?.body === "string" ? json.body.trim() : "";
  } catch {
    return apiError(400, "BAD_REQUEST", "Invalid JSON or missing body");
  }
  if (!body || body.length > 4000) return apiError(400, "BAD_REQUEST", "Body required (max 4000 chars)");

  const senderName = (user as { name?: string }).name?.trim() || "Guest";
  const snippet = body.slice(0, 40);
  const autoSubject = snippet ? `${senderName} - ${snippet}` : senderName;

  // 게스트당 고객센터 티켓은 최대 1개만 사용.
  // 이미 티켓이 있으면 그 티켓을 다시 열고 메시지만 추가한다.
  const existing = await prisma.supportTicket.findFirst({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });

  let ticket = existing;

  if (!ticket) {
    const created = await createTicket({ userId: user.id, subject: autoSubject, body });
    return apiOk(
      {
        id: created.id,
        subject: created.subject,
        status: created.status,
        createdAt: created.createdAt.toISOString(),
        messages: created.messages.map((m) => ({
          id: m.id,
          body: m.body,
          senderRole: m.senderRole,
          createdAt: m.createdAt.toISOString(),
        })),
      },
      201
    );
  }

  // 기존 티켓에 메시지만 추가
  await prisma.supportMessage.create({
    data: {
      ticketId: ticket.id,
      senderUserId: user.id,
      senderRole: "USER",
      body,
    },
  });
  const messages = await getMessagesByTicketId(ticket.id);

  return apiOk(
    {
      id: ticket.id,
      subject: ticket.subject,
      status: ticket.status,
      createdAt: ticket.createdAt.toISOString(),
      messages: messages.map((m) => ({
        id: m.id,
        body: m.body,
        senderRole: m.senderRole,
        createdAt: m.createdAt.toISOString(),
      })),
    },
    201
  );
}
