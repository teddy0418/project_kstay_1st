import { prisma } from "@/lib/db";
import type { SupportMessageSenderRole, SupportTicketStatus } from "@prisma/client";

/** 내 티켓 목록 (게스트/호스트용). 최신순. */
export async function findTicketsByUserId(userId: string, limit = 50) {
  return prisma.supportTicket.findMany({
    where: { userId },
    orderBy: { updatedAt: "desc" },
    take: limit,
    select: {
      id: true,
      subject: true,
      status: true,
      createdAt: true,
      updatedAt: true,
    },
  });
}

/** 관리자: 전체 티켓 목록 (최신순) */
export async function findAllTickets(limit = 100) {
  return prisma.supportTicket.findMany({
    orderBy: { updatedAt: "desc" },
    take: limit,
    select: {
      id: true,
      userId: true,
      subject: true,
      status: true,
      createdAt: true,
      updatedAt: true,
      user: { select: { id: true, name: true, email: true, displayName: true, nationality: true } },
    },
  });
}

/** 티켓 1건 (소유자 또는 ADMIN만 접근) */
export async function getTicketById(ticketId: string) {
  return prisma.supportTicket.findUnique({
    where: { id: ticketId },
    include: {
      user: { select: { id: true, name: true, email: true, displayName: true } },
    },
  });
}

/** 티켓 소유자인지 */
export async function isTicketOwner(ticketId: string, userId: string): Promise<boolean> {
  const t = await prisma.supportTicket.findUnique({
    where: { id: ticketId },
    select: { userId: true },
  });
  return t?.userId === userId;
}

/** 티켓의 마지막 메시지 1건 (목록 프리뷰용) */
export async function getLastMessageByTicketId(ticketId: string) {
  return prisma.supportMessage.findFirst({
    where: { ticketId },
    orderBy: { createdAt: "desc" },
    select: { body: true, createdAt: true, senderRole: true },
  });
}

/** 티켓 내 메시지 목록 (시간순) */
export async function getMessagesByTicketId(ticketId: string) {
  return prisma.supportMessage.findMany({
    where: { ticketId },
    orderBy: { createdAt: "asc" },
    include: {
      sender: { select: { id: true, name: true, displayName: true, profilePhotoUrl: true, role: true } },
    },
  });
}

/** 티켓 생성 + 첫 메시지 (USER) */
export async function createTicket(params: { userId: string; subject: string; body: string }) {
  const subject = params.subject.trim().slice(0, 500);
  const body = params.body.trim().slice(0, 4000);
  const ticket = await prisma.supportTicket.create({
    data: {
      userId: params.userId,
      subject,
      status: "OPEN",
      messages: {
        create: {
          senderUserId: params.userId,
          senderRole: "USER",
          body,
        },
      },
    },
    include: {
      messages: {
        orderBy: { createdAt: "asc" },
        include: { sender: { select: { id: true, name: true, displayName: true } } },
      },
    },
  });
  return ticket;
}

/** 티켓에 메시지 추가. SUPPORT가 보내면 문의자에게 알림 생성 */
export async function createSupportMessage(params: {
  ticketId: string;
  senderUserId: string;
  senderRole: SupportMessageSenderRole;
  body: string;
}) {
  const body = params.body.trim().slice(0, 4000);
  const msg = await prisma.supportMessage.create({
    data: {
      ticketId: params.ticketId,
      senderUserId: params.senderUserId,
      senderRole: params.senderRole,
      body,
    },
    include: {
      sender: { select: { id: true, name: true, displayName: true } },
    },
  });

  if (params.senderRole === "SUPPORT") {
    const ticket = await prisma.supportTicket.findUnique({
      where: { id: params.ticketId },
      select: { userId: true },
    });
    if (ticket?.userId) {
      await prisma.notification.create({
        data: {
          userId: ticket.userId,
          type: "SUPPORT_REPLIED",
          supportTicketId: params.ticketId,
          supportMessageId: msg.id,
        },
      });
    }
  }

  return msg;
}

/** 관리자: 티켓 진행 상태 변경 */
export async function updateTicketStatus(ticketId: string, status: SupportTicketStatus) {
  return prisma.supportTicket.update({
    where: { id: ticketId },
    data: { status },
  });
}

/** 이 티켓에 대한 해당 유저의 SUPPORT_REPLIED 알림 읽음 처리 */
export async function markSupportNotificationsReadByTicketAndUser(ticketId: string, userId: string) {
  await prisma.notification.updateMany({
    where: { userId, supportTicketId: ticketId, readAt: null },
    data: { readAt: new Date() },
  });
}
