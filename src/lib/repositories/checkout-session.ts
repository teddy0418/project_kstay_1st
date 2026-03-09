import type { PaymentProvider } from "@prisma/client";
import { prisma } from "@/lib/db";

/** 결제 성공 시 Booking 생성에 필요한 데이터. JSON 저장용으로 날짜는 ISO 문자열 가능. */
export type CheckoutSessionPayload = {
  guestUserId: string | null;
  guestEmail: string;
  guestName: string | null;
  guestMessageToHost?: string | null;
  nights: number;
  guestsAdults: number;
  guestsChildren: number;
  guestsInfants: number;
  guestsPets: number;
  totalUsd: number;
  totalKrw: number;
  accommodationKrw?: number | null;
  guestServiceFeeKrw?: number | null;
  cancellationDeadlineKst: Date | string;
  paymentProvider: PaymentProvider;
  paymentStoreId: string | null;
  paymentAmountKrw?: number | null;
  /** 실제 결제 통화 (USD | KRW | JPY). 영수증/인보이스 표시용 */
  paymentCurrency?: string | null;
  /** 결제 금액: USD=센트, KRW/JPY=정수 */
  paymentAmount?: number | null;
  /** 게스트 요청 표시 통화 (TWD, JPY 등) */
  currency?: string | null;
  isNonRefundableSpecial?: boolean;
  cancellationPolicyVersion?: string | null;
  policyTextLocale?: string | null;
  policyType?: string | null;
  freeCancelEndsAt?: Date | string | null;
  refundSchedule?: string | null;
  policyAgreedAt?: Date | string | null;
};

const CHECKOUT_HOLD_MINUTES = 15;

export function getCheckoutSessionExpiresAt(): Date {
  const d = new Date();
  d.setMinutes(d.getMinutes() + CHECKOUT_HOLD_MINUTES);
  return d;
}

/** 결제 홀드와 CONFIRMED 예약과의 겹침 여부 확인 */
export async function hasOverlappingBookingOrHold(
  listingId: string,
  checkIn: Date,
  checkOut: Date,
  excludeSessionToken?: string | null
): Promise<boolean> {
  const now = new Date();
  const [overlapBooking, overlapSession] = await Promise.all([
    prisma.booking.findFirst({
      where: {
        listingId,
        status: "CONFIRMED",
        AND: [{ checkIn: { lt: checkOut } }, { checkOut: { gt: checkIn } }],
      },
      select: { id: true },
    }),
    prisma.checkoutSession.findFirst({
      where: {
        listingId,
        expiresAt: { gt: now },
        AND: [{ checkIn: { lt: checkOut } }, { checkOut: { gt: checkIn } }],
        ...(excludeSessionToken ? { token: { not: excludeSessionToken } } : {}),
      },
      select: { id: true },
    }),
  ]);
  return !!overlapBooking || !!overlapSession;
}

export async function createCheckoutSession(params: {
  token: string;
  listingId: string;
  checkIn: Date;
  checkOut: Date;
  payload: CheckoutSessionPayload;
}) {
  const expiresAt = getCheckoutSessionExpiresAt();
  return prisma.checkoutSession.create({
    data: {
      token: params.token,
      listingId: params.listingId,
      checkIn: params.checkIn,
      checkOut: params.checkOut,
      expiresAt,
      payload: params.payload as object,
    },
    select: { token: true, expiresAt: true },
  });
}

export async function findCheckoutSessionByToken(token: string) {
  return prisma.checkoutSession.findUnique({
    where: { token },
    include: { listing: { select: { title: true } } },
  });
}

/** 결제 성공 시 CheckoutSession → Booking(CONFIRMED) + Payment(PAID) 생성 후 세션 삭제 */
export async function createBookingFromCheckoutSession(
  sessionToken: string,
  paymentInfo: { paymentId: string; storeId: string | null; pgTid: string | null; paymentRawJson: string }
) {
  const session = await prisma.checkoutSession.findUnique({
    where: { token: sessionToken },
    include: { listing: { select: { id: true } } },
  });
  if (!session) return null;
  const p = session.payload as CheckoutSessionPayload;
  const cancellationDeadlineKst =
    typeof p.cancellationDeadlineKst === "string"
      ? new Date(p.cancellationDeadlineKst)
      : p.cancellationDeadlineKst;
  const freeCancelEndsAt =
    p.freeCancelEndsAt == null
      ? null
      : typeof p.freeCancelEndsAt === "string"
        ? new Date(p.freeCancelEndsAt)
        : p.freeCancelEndsAt;
  const policyAgreedAt =
    p.policyAgreedAt == null
      ? null
      : typeof p.policyAgreedAt === "string"
        ? new Date(p.policyAgreedAt)
        : p.policyAgreedAt;

  const booking = await prisma.$transaction(async (tx) => {
    const created = await tx.booking.create({
      data: {
        publicToken: sessionToken,
        listingId: session.listingId,
        guestUserId: p.guestUserId ?? null,
        guestEmail: p.guestEmail,
        guestName: p.guestName ?? null,
        guestMessageToHost: p.guestMessageToHost ?? null,
        checkIn: session.checkIn,
        checkOut: session.checkOut,
        nights: p.nights,
        guestsAdults: p.guestsAdults,
        guestsChildren: p.guestsChildren,
        guestsInfants: p.guestsInfants,
        guestsPets: p.guestsPets,
        currency: (p.currency ?? "USD").slice(0, 10),
        totalUsd: p.totalUsd,
        totalKrw: p.totalKrw,
        paymentCurrency: p.paymentCurrency ?? null,
        paymentAmount: p.paymentAmount ?? null,
        accommodationKrw: p.accommodationKrw ?? null,
        guestServiceFeeKrw: p.guestServiceFeeKrw ?? null,
        cancellationDeadlineKst,
        status: "CONFIRMED",
        confirmedAt: new Date(),
        isNonRefundableSpecial: p.isNonRefundableSpecial ?? false,
        cancellationPolicyVersion: p.cancellationPolicyVersion ?? null,
        policyTextLocale: p.policyTextLocale ?? null,
        policyType: p.policyType ?? null,
        freeCancelEndsAt,
        refundSchedule: p.refundSchedule ?? null,
        policyAgreedAt,
        payments: {
          create: {
            provider: p.paymentProvider,
            status: "PAID",
            paidAt: new Date(),
            amountUsd: p.totalUsd,
            amountKrw: p.paymentAmountKrw ?? null,
            providerPaymentId: paymentInfo.paymentId,
            storeId: paymentInfo.storeId,
            pgTid: paymentInfo.pgTid,
            rawJson: paymentInfo.paymentRawJson,
          },
        },
      },
      include: { listing: { select: { title: true } } },
    });
    await tx.checkoutSession.delete({ where: { id: session.id } });
    return created;
  });
  return booking;
}

export async function deleteExpiredCheckoutSessions(): Promise<number> {
  const result = await prisma.checkoutSession.deleteMany({
    where: { expiresAt: { lt: new Date() } },
  });
  return result.count;
}
