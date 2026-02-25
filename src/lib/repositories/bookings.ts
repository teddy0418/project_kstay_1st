import type { PaymentProvider } from "@prisma/client";
import { prisma } from "@/lib/db";

type ListingPricing = {
  id: string;
  title: string;
  basePriceKrw: number;
  freeCancellationDays: number | null;
  nonRefundableSpecialEnabled: boolean;
};

type CreateBookingInput = {
  publicToken: string;
  listingId: string;
  guestUserId: string | null;
  guestEmail: string;
  guestName: string | null;
  checkIn: Date;
  checkOut: Date;
  nights: number;
  guestsAdults: number;
  guestsChildren: number;
  guestsInfants: number;
  guestsPets: number;
  totalUsd: number;
  totalKrw: number;
  /** 숙박료 (수수료 제외). 게스트 결제 내역·호스트 수령 일관성용 */
  accommodationKrw?: number | null;
  /** 게스트 서비스 수수료 12%. accommodationKrw * 0.12 */
  guestServiceFeeKrw?: number | null;
  cancellationDeadlineKst: Date;
  paymentProvider: PaymentProvider;
  paymentStoreId: string | null;
  /** KRW 결제 시 웹훅 금액 검증용 */
  paymentAmountKrw?: number | null;
  /** 환불 불가 특가 예약 여부 */
  isNonRefundableSpecial?: boolean;
  cancellationPolicyVersion?: string | null;
  policyTextLocale?: string | null;
  policyType?: string | null;
  freeCancelEndsAt?: Date | null;
  refundSchedule?: string | null;
  policyAgreedAt?: Date | null;
};

export async function findListingPricingById(listingId: string): Promise<ListingPricing | null> {
  return prisma.listing.findUnique({
    where: { id: listingId },
    select: {
      id: true,
      title: true,
      basePriceKrw: true,
      freeCancellationDays: true,
      nonRefundableSpecialEnabled: true,
    },
  });
}

export async function createPendingBookingWithPayment(input: CreateBookingInput): Promise<{ publicToken: string }> {
  return prisma.booking.create({
    data: {
      publicToken: input.publicToken,
      listingId: input.listingId,
      guestUserId: input.guestUserId,
      guestEmail: input.guestEmail,
      guestName: input.guestName,
      checkIn: input.checkIn,
      checkOut: input.checkOut,
      nights: input.nights,
      guestsAdults: input.guestsAdults,
      guestsChildren: input.guestsChildren,
      guestsInfants: input.guestsInfants,
      guestsPets: input.guestsPets,
      currency: "USD",
      totalUsd: input.totalUsd,
      totalKrw: input.totalKrw,
      accommodationKrw: input.accommodationKrw ?? null,
      guestServiceFeeKrw: input.guestServiceFeeKrw ?? null,
      cancellationDeadlineKst: input.cancellationDeadlineKst,
      status: "PENDING_PAYMENT",
      isNonRefundableSpecial: input.isNonRefundableSpecial ?? false,
      cancellationPolicyVersion: input.cancellationPolicyVersion ?? null,
      policyTextLocale: input.policyTextLocale ?? null,
      policyType: input.policyType ?? null,
      freeCancelEndsAt: input.freeCancelEndsAt ?? null,
      refundSchedule: input.refundSchedule ?? null,
      policyAgreedAt: input.policyAgreedAt ?? null,
      payments: {
        create: {
          provider: input.paymentProvider,
          status: "INITIATED",
          amountUsd: input.totalUsd,
          amountKrw: input.paymentAmountKrw ?? null,
          providerPaymentId: input.publicToken,
          storeId: input.paymentStoreId,
        },
      },
    },
    select: { publicToken: true },
  });
}

export async function findPublicBookingByToken(token: string) {
  return prisma.booking.findUnique({
    where: { publicToken: token },
    include: {
      listing: {
        select: { id: true, title: true, city: true, area: true, address: true },
      },
    },
  });
}

/** 게스트가 체크아웃한 뒤 머문 숙소(CONFIRMED, checkOut < today). 프로필 Your trips용. 오늘은 UTC 00:00 기준 */
export async function findPastStaysByGuestUserId(guestUserId: string) {
  const now = new Date();
  const startOfTodayUtc = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0));

  return prisma.booking.findMany({
    where: {
      guestUserId,
      status: "CONFIRMED",
      checkOut: { lt: startOfTodayUtc },
    },
    orderBy: { checkOut: "desc" },
    take: 50,
    include: {
      listing: {
        include: {
          images: { orderBy: { sortOrder: "asc" } },
        },
      },
    },
  });
}
