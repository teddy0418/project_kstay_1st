import { prisma } from "@/lib/db";
import type { MessageSenderRole } from "@prisma/client";

/** 게스트용: CONFIRMED 예약 목록 (메시지함 진입 가능한 예약) */
export async function findConfirmedBookingsByGuestUserId(guestUserId: string) {
  return prisma.booking.findMany({
    where: { guestUserId, status: "CONFIRMED" },
    orderBy: { checkIn: "desc" },
    take: 100,
    select: {
      id: true,
      checkIn: true,
      checkOut: true,
      nights: true,
      listingId: true,
      listing: { select: { id: true, title: true, hostId: true } },
    },
  });
}

/** 호스트용: 내 숙소의 CONFIRMED 예약 목록 */
export async function findConfirmedBookingsByHostId(hostId: string) {
  return prisma.booking.findMany({
    where: { status: "CONFIRMED", listing: { hostId } },
    orderBy: { checkIn: "desc" },
    take: 100,
    select: {
      id: true,
      checkIn: true,
      checkOut: true,
      nights: true,
      guestUserId: true,
      guestName: true,
      listingId: true,
      listing: { select: { id: true, title: true } },
    },
  });
}

/** 예약 건 메시지 목록 (시간순). body만 반환해 번역은 클라이언트/나중에. */
export async function getMessagesByBookingId(bookingId: string) {
  return prisma.bookingMessage.findMany({
    where: { bookingId },
    orderBy: { createdAt: "asc" },
    include: {
      sender: { select: { id: true, name: true, displayName: true, profilePhotoUrl: true } },
    },
  });
}

/** 예약 건의 마지막 메시지 1건 (목록 프리뷰용) */
export async function getLastMessageByBookingId(bookingId: string) {
  return prisma.bookingMessage.findFirst({
    where: { bookingId },
    orderBy: { createdAt: "desc" },
    select: { body: true, createdAt: true, senderRole: true },
  });
}

/** 예약에 메시지 작성. 호스트가 보내면 알림 생성. */
export async function createBookingMessage(params: {
  bookingId: string;
  senderUserId: string;
  senderRole: MessageSenderRole;
  body: string;
}) {
  const body = params.body.trim().slice(0, 4000);
  const msg = await prisma.bookingMessage.create({
    data: {
      bookingId: params.bookingId,
      senderUserId: params.senderUserId,
      senderRole: params.senderRole,
      body,
    },
    include: {
      sender: { select: { id: true, name: true, displayName: true } },
    },
  });

  if (params.senderRole === "HOST") {
    const booking = await prisma.booking.findUnique({
      where: { id: params.bookingId },
      select: { guestUserId: true },
    });
    if (booking?.guestUserId) {
      await prisma.notification.create({
        data: {
          userId: booking.guestUserId,
          type: "HOST_REPLIED",
          bookingId: params.bookingId,
          messageId: msg.id,
        },
      });
    }
  }

  return msg;
}

/** 이 예약 건에 대한 미읽음 알림을 읽음 처리 (게스트가 스레드 열었을 때) */
export async function markNotificationsReadByBookingAndUser(bookingId: string, userId: string) {
  await prisma.notification.updateMany({
    where: { userId, bookingId, readAt: null },
    data: { readAt: new Date() },
  });
}

/** 사용자의 미읽음 알림 개수 */
export async function getUnreadNotificationCount(userId: string): Promise<number> {
  return prisma.notification.count({
    where: { userId, readAt: null },
  });
}

/** 사용자의 알림 목록 (최신순) */
export async function getNotificationsByUserId(userId: string, limit = 50) {
  return prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

/** 알림 1건 읽음 처리 */
export async function markNotificationRead(notificationId: string, userId: string) {
  return prisma.notification.updateMany({
    where: { id: notificationId, userId },
    data: { readAt: new Date() },
  });
}

/** 예약이 이 게스트 소유인지 */
export async function isBookingGuest(bookingId: string, userId: string): Promise<boolean> {
  const b = await prisma.booking.findUnique({
    where: { id: bookingId },
    select: { guestUserId: true },
  });
  return b?.guestUserId === userId;
}

/** 예약의 숙소 호스트가 이 유저인지 */
export async function isBookingHost(bookingId: string, userId: string): Promise<boolean> {
  const b = await prisma.booking.findUnique({
    where: { id: bookingId },
    select: { listing: { select: { hostId: true } } },
  });
  return b?.listing?.hostId === userId;
}
