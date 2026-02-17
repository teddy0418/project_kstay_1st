import { randomUUID } from "crypto";
import { prisma } from "@/lib/db";
import { apiError, apiOk } from "@/lib/api/response";
import { getServerSessionUser } from "@/lib/auth/server";
import { buildCancellationDeadlineKst, nightsBetween, parseISODate } from "@/lib/bookings/utils";

type CreateBookingBody = {
  listingId?: string;
  checkIn?: string;
  checkOut?: string;
  guestEmail?: string;
  guestName?: string;
  guestsAdults?: number;
  guestsChildren?: number;
  guestsInfants?: number;
  guestsPets?: number;
};

type CreateBookingResponse = {
  token: string;
  nextUrl: string;
  portone?: {
    storeId: string;
    channelKey: string;
    paymentId: string;
    orderName: string;
    totalAmount: number;
    currency: "USD" | "KRW";
    redirectUrl: string;
    forceRedirect: true;
  };
};

export async function POST(req: Request) {
  const providerMode = (process.env.PAYMENT_PROVIDER || "MOCK").toUpperCase();
  const body = (await req.json()) as CreateBookingBody;
  const listingId = String(body.listingId ?? "").trim();
  if (!listingId) return apiError(400, "BAD_REQUEST", "listingId is required");

  const checkInDate = parseISODate(body.checkIn);
  const checkOutDate = parseISODate(body.checkOut);
  if (!checkInDate || !checkOutDate) return apiError(400, "BAD_REQUEST", "Invalid check-in/check-out date");

  const nights = nightsBetween(checkInDate, checkOutDate);
  if (nights <= 0) return apiError(400, "BAD_REQUEST", "Stay must be at least 1 night");

  const listing = await prisma.listing.findUnique({
    where: { id: listingId },
    select: { id: true, title: true, basePriceKrw: true },
  });
  if (!listing) return apiError(404, "NOT_FOUND", "Listing not found");

  const sessionUser = await getServerSessionUser();
  const guestEmail = String(body.guestEmail ?? sessionUser?.email ?? "").trim();
  if (!guestEmail) return apiError(400, "BAD_REQUEST", "guestEmail is required");

  const guestName = String(body.guestName ?? sessionUser?.name ?? "").trim() || null;
  const guestsAdults = Math.max(1, Number(body.guestsAdults ?? 1));
  const guestsChildren = Math.max(0, Number(body.guestsChildren ?? 0));
  const guestsInfants = Math.max(0, Number(body.guestsInfants ?? 0));
  const guestsPets = Math.max(0, Number(body.guestsPets ?? 0));

  const totalKrw = listing.basePriceKrw * nights;
  const totalUsd = Math.max(1, Math.round(totalKrw / 13));
  const cancellationDeadlineKst = buildCancellationDeadlineKst(String(body.checkIn));
  const publicToken = randomUUID().replace(/-/g, "");

  const booking = await prisma.booking.create({
    data: {
      publicToken,
      listingId: listing.id,
      guestUserId: sessionUser?.id ?? null,
      guestEmail,
      guestName,
      checkIn: checkInDate,
      checkOut: checkOutDate,
      nights,
      guestsAdults,
      guestsChildren,
      guestsInfants,
      guestsPets,
      currency: "USD",
      totalUsd,
      totalKrw,
      cancellationDeadlineKst,
      status: "PENDING_PAYMENT",
      payments: {
        create: {
          provider: providerMode === "PORTONE" ? "PORTONE" : "MOCK",
          status: "INITIATED",
          amountUsd: totalUsd,
          providerPaymentId: publicToken,
          storeId: process.env.PORTONE_STORE_ID ?? null,
        },
      },
    },
    select: {
      publicToken: true,
    },
  });

  const payload: CreateBookingResponse = {
    token: booking.publicToken,
    nextUrl: `/checkout/success/${booking.publicToken}`,
  };

  if (providerMode === "PORTONE") {
    const storeId = String(process.env.PORTONE_STORE_ID ?? "").trim();
    const channelKey = String(process.env.PORTONE_CHANNEL_KEY ?? "").trim();
    const siteUrl = String(
      process.env.NEXT_PUBLIC_SITE_URL || process.env.AUTH_URL || "http://localhost:3001"
    ).replace(/\/+$/, "");

    if (!storeId || !channelKey) {
      return apiError(500, "INTERNAL_ERROR", "PortOne env is not configured");
    }

    const bookingCurrency: "USD" | "KRW" = "USD";
    const totalAmount = totalUsd;

    payload.portone = {
      storeId,
      channelKey,
      paymentId: booking.publicToken,
      orderName: `${listing.title} (${nights} nights)`,
      totalAmount,
      currency: bookingCurrency,
      redirectUrl: `${siteUrl}/payment-redirect`,
      forceRedirect: true,
    };
  }

  return apiOk(payload, 201);
}
