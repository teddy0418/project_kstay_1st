import type { PaymentProvider } from "@prisma/client";
import { prisma } from "@/lib/db";

type ListingPricing = {
  id: string;
  title: string;
  basePriceKrw: number;
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
  cancellationDeadlineKst: Date;
  paymentProvider: PaymentProvider;
  paymentStoreId: string | null;
  /** KRW 결제 시 웹훅 금액 검증용 */
  paymentAmountKrw?: number | null;
};

export async function findListingPricingById(listingId: string): Promise<ListingPricing | null> {
  return prisma.listing.findUnique({
    where: { id: listingId },
    select: { id: true, title: true, basePriceKrw: true },
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
      cancellationDeadlineKst: input.cancellationDeadlineKst,
      status: "PENDING_PAYMENT",
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
