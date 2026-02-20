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
