import { randomUUID } from "crypto";
import { prisma } from "@/lib/db";
import { apiError, apiOk } from "@/lib/api/response";
import { parseJsonBody } from "@/lib/api/validation";
import { getServerSessionUser } from "@/lib/auth/server";
import { buildCancellationDeadlineKst, nightsBetween, parseISODate } from "@/lib/bookings/utils";
import { createBookingSchema } from "@/lib/validation/schemas";
import {
  createPendingBookingWithPayment,
  findListingPricingById,
  findPastStaysByGuestUserId,
} from "@/lib/repositories/bookings";
import { getExchangeRates } from "@/lib/exchange";
import type { Listing } from "@/types";

type CreateBookingResponse = {
  token: string;
  nextUrl: string;
  portone?: {
    storeId: string;
    channelKey: string;
    paymentId: string;
    orderName: string;
    totalAmount: number;
    currency: "USD" | "KRW" | "JPY" | "CNY";
    redirectUrl: string;
    forceRedirect: true;
  };
};

function toListingForTrip(row: {
  id: string;
  title: string;
  city: string;
  area: string;
  address: string;
  location: string | null;
  basePriceKrw: number;
  rating: number;
  reviewCount: number;
  hostBio: string | null;
  hostBioKo: string | null;
  hostBioJa: string | null;
  hostBioZh: string | null;
  checkInTime: string | null;
  amenities: string[];
  images: Array<{ url: string; sortOrder: number }>;
}): Listing {
  const images = (row.images ?? []).slice().sort((a, b) => a.sortOrder - b.sortOrder).map((x) => x.url);
  return {
    id: row.id,
    title: row.title,
    location: row.location ?? `${row.city} · ${row.area}`,
    address: row.address,
    images,
    pricePerNightKRW: row.basePriceKrw,
    rating: row.rating ?? 0,
    categories: ["homes"],
    lat: 37.5665,
    lng: 126.978,
    hostName: "KSTAY Host",
    hostBio: row.hostBio ?? "Welcome to KSTAY.",
    hostBioI18n: {
      ko: row.hostBioKo ?? undefined,
      ja: row.hostBioJa ?? undefined,
      zh: row.hostBioZh ?? undefined,
    },
    hostProfileImageUrl:
      "https://images.unsplash.com/photo-1502685104226-ee32379fefbe?auto=format&fit=crop&w=800&q=80",
    checkInTime: row.checkInTime ?? "15:00",
    amenities: Array.isArray(row.amenities) ? row.amenities : [],
  };
}

/** GET: 로그인한 게스트의 체크아웃 완료 숙소(Your trips). */
export async function GET() {
  try {
    const user = await getServerSessionUser();
    if (!user) return apiError(401, "UNAUTHORIZED", "Login required");

    // 세션 id가 JWT와 어긋날 수 있으므로, 이메일이 있으면 DB 유저 id로 한 번 더 확정
    let guestUserId = user.id;
    if (user.email) {
      const dbUser = await prisma.user.findUnique({
        where: { email: user.email.trim().toLowerCase() },
        select: { id: true },
      });
      if (dbUser) guestUserId = dbUser.id;
    }

    const rows = await findPastStaysByGuestUserId(guestUserId);
    const bookingIds = rows.map((b) => b.id);
    const reviewBookingIds =
      bookingIds.length === 0
        ? new Set<string>()
        : new Set(
            (
              await prisma.review.findMany({
                where: { bookingId: { in: bookingIds } },
                select: { bookingId: true },
              })
            ).map((r) => r.bookingId)
          );
    const trips = rows.map((b) => ({
      booking: {
        id: b.id,
        checkIn: b.checkIn.toISOString().slice(0, 10),
        checkOut: b.checkOut.toISOString().slice(0, 10),
        nights: b.nights,
        reviewed: reviewBookingIds.has(b.id),
      },
      listing: toListingForTrip(b.listing as Parameters<typeof toListingForTrip>[0]),
    }));
    return apiOk({ trips });
  } catch (error) {
    console.error("[api/bookings] GET failed", error);
    return apiError(500, "INTERNAL_ERROR", "Failed to load trips");
  }
}

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

    const requestedCurrency = (body.currency ?? "KRW") as "USD" | "KRW" | "JPY" | "CNY";
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
      paymentAmountKrw:
        providerMode === "PORTONE" && requestedCurrency === "KRW" ? totalKrw : null,
    });

    const payload: CreateBookingResponse = {
      token: booking.publicToken,
      nextUrl: `/checkout/success/${booking.publicToken}`,
    };

    if (providerMode === "PORTONE") {
      const storeId = String(process.env.PORTONE_STORE_ID ?? "").trim();
      const paymentMethod = (body.paymentMethod ?? "KAKAOPAY") as "KAKAOPAY" | "PAYPAL" | "EXIMBAY";
      const channelKey = String(
        paymentMethod === "PAYPAL"
          ? process.env.PORTONE_CHANNEL_KEY_PAYPAL
          : paymentMethod === "EXIMBAY"
            ? process.env.PORTONE_CHANNEL_KEY_EXIMBAY
            : process.env.PORTONE_CHANNEL_KEY_KAKAOPAY ?? ""
      ).trim();

      const siteUrl = String(
        process.env.NEXT_PUBLIC_SITE_URL || process.env.AUTH_URL || "http://localhost:3001"
      ).replace(/\/+$/, "");

      if (!storeId || !channelKey) {
        return apiError(500, "INTERNAL_ERROR", "PortOne env is not configured");
      }

      let bookingCurrency = requestedCurrency;
      let totalAmount = totalKrw;

      if (bookingCurrency !== "KRW") {
        try {
          const rates = await getExchangeRates();
          const rate = rates[bookingCurrency];
          if (rate != null && rate > 0) {
            totalAmount = Math.round(totalKrw * rate);
          } else {
            bookingCurrency = "KRW";
          }
        } catch {
          bookingCurrency = "KRW";
        }
      }

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
