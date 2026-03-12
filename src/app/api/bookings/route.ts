import { randomUUID } from "crypto";
import { prisma } from "@/lib/db";
import { apiError, apiOk } from "@/lib/api/response";
import { parseJsonBody } from "@/lib/api/validation";
import { getServerSessionUser } from "@/lib/auth/server";
import {
  buildCancellationSnapshot,
  nightsBetween,
  parseISODate,
} from "@/lib/bookings/utils";
import { createBookingSchema } from "@/lib/validation/schemas";
import {
  createCheckoutSession,
  deleteExpiredCheckoutSessions,
  hasOverlappingBookingOrHold,
} from "@/lib/repositories/checkout-session";
import {
  findListingPricingById,
  findPastStaysByGuestUserId,
} from "@/lib/repositories/bookings";
import { getExchangeRates } from "@/lib/exchange";
import { getDateRangeTotalBaseKRW } from "@/lib/listing-date-prices";
import { calcGuestPriceBreakdownKRW, NON_REFUNDABLE_DISCOUNT_RATE } from "@/lib/policy";
import type { Listing } from "@/types";
import type { Currency } from "@/lib/currency";

type CreateBookingResponse = {
  token: string;
  nextUrl: string;
  portone?: {
    storeId: string;
    channelKey: string;
    paymentId: string;
    orderName: string;
    totalAmount: number;
    currency: "USD" | "KRW" | "JPY";
    redirectUrl: string;
    forceRedirect: true;
  };
};

/** 엑심베이/PortOne 결제 요청 시 지원 통화만 전달 (나머지는 USD) */
function toPortoneCurrency(c: Currency): "USD" | "KRW" | "JPY" {
  if (c === "KRW") return "KRW";
  if (c === "JPY") return "JPY";
  return "USD";
}

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

    await deleteExpiredCheckoutSessions();

    const nights = nightsBetween(checkInDate, checkOutDate);
    if (nights <= 0) return apiError(400, "BAD_REQUEST", "Stay must be at least 1 night");

    const listing = await findListingPricingById(listingId);
    if (!listing) return apiError(404, "NOT_FOUND", "Listing not found");

    const overlapping = await hasOverlappingBookingOrHold(listingId, checkInDate, checkOutDate);
    if (overlapping) {
      return apiError(409, "CONFLICT", "Selected dates are not available");
    }

    const sessionUser = await getServerSessionUser();
    if (!sessionUser) return apiError(401, "UNAUTHORIZED", "Login required to complete booking");

    const guestEmail = (body.guestEmail ?? sessionUser.email ?? "").trim();
    if (!guestEmail) return apiError(400, "BAD_REQUEST", "guestEmail is required");

    const guestName = (body.guestName ?? sessionUser.name ?? "").trim();
    if (!guestName) return apiError(400, "BAD_REQUEST", "guestName is required");
    const guestMessageToHost = (body.guestMessageToHost ?? "").trim() || null;
    const guestsAdults = Math.max(1, body.guestsAdults ?? 1);
    const guestsChildren = Math.max(0, body.guestsChildren ?? 0);
    const guestsInfants = Math.max(0, body.guestsInfants ?? 0);
    const guestsPets = Math.max(0, body.guestsPets ?? 0);

    const isNonRefundableSpecial =
      Boolean(listing.nonRefundableSpecialEnabled) && Boolean(body.isNonRefundableSpecial);
    const baseBeforeDiscount =
      (await getDateRangeTotalBaseKRW(listingId, body.checkIn, body.checkOut)) ||
      listing.basePriceKrw * nights;
    const baseKrw = isNonRefundableSpecial
      ? Math.round(baseBeforeDiscount * (1 - NON_REFUNDABLE_DISCOUNT_RATE))
      : baseBeforeDiscount;

    const calculated = calcGuestPriceBreakdownKRW(baseKrw);
    let totalKrw = calculated.total;
    let accommodationKrw = calculated.base;
    let guestServiceFeeKrw = calculated.serviceFeeGross;
    if (typeof body.totalKrw === "number" && body.totalKrw > 0) {
      const diff = Math.abs(body.totalKrw - calculated.total) / calculated.total;
      if (diff <= 0.02) {
        totalKrw = Math.round(body.totalKrw);
        accommodationKrw = Math.round(totalKrw / (1 + 0.132));
        guestServiceFeeKrw = totalKrw - accommodationKrw;
      }
    }
    const totalUsd = Math.max(1, Math.round(totalKrw / 13));

    const nowMs = Date.now();
    const snapshot = buildCancellationSnapshot({
      checkInISO: body.checkIn,
      isNonRefundableSpecial,
      bookingCreatedAtUtcMs: nowMs,
      freeCancellationDays: listing.freeCancellationDays ?? undefined,
      policyTextLocale: body.policyTextLocale ?? "en",
    });

    const policyAgreedAt = body.policyAgreedAt ? new Date(body.policyAgreedAt) : new Date(nowMs);

    const publicToken = randomUUID().replace(/-/g, "");

    /** 엑심베이 가이드라인: 결제 요청 currency는 USD 기본 권장(엑심베이 공통 지원). DCC 활성화 시 게스트 통화 전달 가능 */
    const requestedCurrency = (body.currency ?? "USD") as Currency;
    let paymentCurrency: "USD" | "KRW" | "JPY" = "USD";
    let paymentAmount: number = totalKrw;
    if (providerMode === "PORTONE") {
      let bookingCurrency = requestedCurrency;
      let totalAmount = totalKrw;
      const rates: Record<string, number> = { KRW: 1 };
      try {
        const r = await getExchangeRates();
        Object.assign(rates, r);
        const rate = rates[bookingCurrency];
        if (rate != null && rate > 0 && bookingCurrency !== "KRW") {
          totalAmount = Math.round(totalKrw * rate);
        } else {
          bookingCurrency = "KRW";
          totalAmount = totalKrw;
        }
      } catch {
        bookingCurrency = "KRW";
        totalAmount = totalKrw;
      }
      paymentCurrency = toPortoneCurrency(bookingCurrency as Currency);
      if (paymentCurrency !== bookingCurrency) {
        const rate = rates[paymentCurrency];
        if (rate != null && rate > 0) paymentAmount = Math.round(totalKrw * rate);
        else paymentAmount = paymentCurrency === "KRW" ? totalKrw : totalAmount;
      } else {
        paymentAmount = totalAmount;
      }
      if (paymentCurrency === "USD") paymentAmount = Math.round(paymentAmount * 100);
    }

    const sessionPayload = {
      guestUserId: sessionUser.id,
      guestEmail,
      guestName,
      guestMessageToHost,
      nights,
      guestsAdults,
      guestsChildren,
      guestsInfants,
      guestsPets,
      totalUsd,
      totalKrw,
      accommodationKrw,
      guestServiceFeeKrw,
      cancellationDeadlineKst: snapshot.cancellationDeadlineKst.toISOString(),
      paymentProvider: (providerMode === "PORTONE" ? "PORTONE" : "MOCK") as "PORTONE" | "MOCK",
      paymentStoreId: process.env.PORTONE_STORE_ID ?? null,
      paymentAmountKrw:
        providerMode === "PORTONE" && requestedCurrency === "KRW" ? totalKrw : null,
      paymentCurrency: providerMode === "PORTONE" ? paymentCurrency : null,
      paymentAmount: providerMode === "PORTONE" ? paymentAmount : null,
      currency: requestedCurrency,
      isNonRefundableSpecial,
      cancellationPolicyVersion: snapshot.cancellationPolicyVersion,
      policyTextLocale: body.policyTextLocale ?? "en",
      policyType: snapshot.policyType,
      freeCancelEndsAt: snapshot.freeCancelEndsAt?.toISOString() ?? null,
      refundSchedule: snapshot.refundSchedule,
      policyAgreedAt: policyAgreedAt.toISOString(),
    };
    await createCheckoutSession({
      token: publicToken,
      listingId: listing.id,
      checkIn: checkInDate,
      checkOut: checkOutDate,
      payload: sessionPayload,
    });

    const payload: CreateBookingResponse = {
      token: publicToken,
      nextUrl: `/checkout/success/${publicToken}`,
    };

    if (providerMode === "PORTONE") {
      const storeId = String(process.env.PORTONE_STORE_ID ?? "").trim();
      const channelKey = String(
        process.env.PORTONE_CHANNEL_KEY_EXIMBAY ??
        process.env.PORTONE_CHANNEL_KEY_PAYMENTWALL ??
        process.env.PORTONE_CHANNEL_KEY ??
        ""
      ).trim();

      const siteUrl = String(
        process.env.NEXT_PUBLIC_SITE_URL || process.env.AUTH_URL || "http://localhost:3001"
      ).replace(/\/+$/, "");

      if (!storeId || !channelKey) {
        return apiError(500, "INTERNAL_ERROR", "PortOne env is not configured");
      }

      payload.portone = {
        storeId,
        channelKey,
        paymentId: publicToken,
        orderName: `${listing.title} (${nights} nights)`,
        totalAmount: paymentAmount,
        currency: paymentCurrency,
        redirectUrl: `${siteUrl}/payment-redirect`,
        forceRedirect: true,
      };
    }

    return apiOk(payload, 201);
  } catch (error) {
    console.error("[api/bookings] failed to create booking", error);
    const message =
      error instanceof Error && error.message ? error.message : "Failed to create booking";
    return apiError(500, "INTERNAL_ERROR", message);
  }
}
