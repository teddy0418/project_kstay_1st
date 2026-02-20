import { randomUUID } from "crypto";
import { prisma } from "@/lib/db";
import { apiError, apiOk } from "@/lib/api/response";
import { parseJsonBody } from "@/lib/api/validation";
import { getServerSessionUser } from "@/lib/auth/server";
import { buildCancellationDeadlineKst, nightsBetween, parseISODate } from "@/lib/bookings/utils";
import { createBookingSchema } from "@/lib/validation/schemas";
import { createPendingBookingWithPayment, findListingPricingById } from "@/lib/repositories/bookings";

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
  try {
    const providerMode = (process.env.PAYMENT_PROVIDER || "MOCK").toUpperCase();
    const parsedBody = await parseJsonBody(req, createBookingSchema);
    if (!parsedBody.ok) return parsedBody.response;
    const body = parsedBody.data;
    const listingId = body.listingId;

    const checkInDate = parseISODate(body.checkIn);
    const checkOutDate = parseISODate(body.checkOut);
    if (!checkInDate || !checkOutDate) return apiError(400, "BAD_REQUEST", "Invalid check-in/check-out date");

    const nights = nightsBetween(checkInDate, checkOutDate);
    if (nights <= 0) return apiError(400, "BAD_REQUEST", "Stay must be at least 1 night");

    const listing = await findListingPricingById(listingId);
    if (!listing) return apiError(404, "NOT_FOUND", "Listing not found");

    const overlapping = await prisma.booking.findFirst({
      where: {
        listingId,
        status: { in: ["PENDING_PAYMENT", "CONFIRMED"] },
        AND: [{ checkIn: { lt: checkOutDate } }, { checkOut: { gt: checkInDate } }],
      },
      select: { id: true },
    });
    if (overlapping) {
      return apiError(409, "CONFLICT", "Selected dates are not available");
    }

    const sessionUser = await getServerSessionUser();
    const guestEmail = (body.guestEmail ?? sessionUser?.email ?? "").trim();
    if (!guestEmail) return apiError(400, "BAD_REQUEST", "guestEmail is required");

    const guestName = (body.guestName ?? sessionUser?.name ?? "").trim() || null;
    const guestsAdults = Math.max(1, body.guestsAdults ?? 1);
    const guestsChildren = Math.max(0, body.guestsChildren ?? 0);
    const guestsInfants = Math.max(0, body.guestsInfants ?? 0);
    const guestsPets = Math.max(0, body.guestsPets ?? 0);

    const totalKrw = listing.basePriceKrw * nights;
    const totalUsd = Math.max(1, Math.round(totalKrw / 13));
    const cancellationDeadlineKst = buildCancellationDeadlineKst(body.checkIn);
    const publicToken = randomUUID().replace(/-/g, "");

    const booking = await createPendingBookingWithPayment({
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
      totalUsd,
      totalKrw,
      cancellationDeadlineKst,
      paymentProvider: providerMode === "PORTONE" ? "PORTONE" : "MOCK",
      paymentStoreId: process.env.PORTONE_STORE_ID ?? null,
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

      // PortOne KR channels generally expect KRW amounts.
      const bookingCurrency: "USD" | "KRW" = "KRW";
      const totalAmount = totalKrw;

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
  } catch (error) {
    console.error("[api/bookings] failed to create booking", error);
    return apiError(500, "INTERNAL_ERROR", "Failed to create booking");
  }
}
