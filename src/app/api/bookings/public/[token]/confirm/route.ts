import React from "react";
import { prisma } from "@/lib/db";
import { apiError, apiOk } from "@/lib/api/response";
import { formatCancellationDeadlineKst, formatDateEn, formatUsdFromCents } from "@/lib/bookings/utils";
import BookingConfirmedEmail from "@/emails/BookingConfirmedEmail";
import { sendEmailWithResend } from "@/lib/email/resend";

export const runtime = "nodejs";

export async function POST(_: Request, ctx: { params: Promise<{ token: string }> }) {
  const providerMode = (process.env.PAYMENT_PROVIDER || "MOCK").toUpperCase();
  if (providerMode !== "MOCK") {
    return apiError(403, "FORBIDDEN", "Mock confirm endpoint is disabled for this payment provider");
  }

  const { token } = await ctx.params;
  if (!token) return apiError(400, "BAD_REQUEST", "Booking token is required");

  const existing = await prisma.booking.findUnique({
    where: { publicToken: token },
    include: {
      listing: {
        select: { title: true },
      },
      payments: {
        orderBy: { createdAt: "asc" },
      },
    },
  });
  if (!existing) return apiError(404, "NOT_FOUND", "Booking not found");

  if (existing.status === "CONFIRMED") {
    return apiOk({ token, status: existing.status });
  }
  if (existing.status !== "PENDING_PAYMENT") {
    return apiError(409, "CONFLICT", "Booking cannot be confirmed in current status");
  }

  const confirmed = await prisma.$transaction(async (tx) => {
    const booking = await tx.booking.update({
      where: { id: existing.id },
      data: {
        status: "CONFIRMED",
        confirmedAt: new Date(),
      },
      include: {
        listing: {
          select: { title: true },
        },
      },
    });

    const firstPayment = await tx.payment.findFirst({
      where: { bookingId: booking.id },
      orderBy: { createdAt: "asc" },
    });

    if (firstPayment) {
      await tx.payment.update({
        where: { id: firstPayment.id },
        data: {
          status: "PAID",
          paidAt: new Date(),
        },
      });
    }

    return booking;
  });

  if (!existing.confirmationEmailSentAt && confirmed.guestEmail) {
    try {
      await sendEmailWithResend({
        to: confirmed.guestEmail,
        subject: "KSTAY booking confirmed",
        react: React.createElement(BookingConfirmedEmail, {
          bookingToken: confirmed.publicToken,
          listingTitle: confirmed.listing.title,
          checkIn: formatDateEn(confirmed.checkIn),
          checkOut: formatDateEn(confirmed.checkOut),
          guestsText: `${confirmed.guestsAdults} adults, ${confirmed.guestsChildren} children, ${confirmed.guestsInfants} infants, ${confirmed.guestsPets} pets`,
          totalText: `${formatUsdFromCents(confirmed.totalUsd)} / ₩${confirmed.totalKrw.toLocaleString()}`,
          cancellationDeadlineKst: formatCancellationDeadlineKst(confirmed.cancellationDeadlineKst),
          manageUrl: `${process.env.NEXT_PUBLIC_SITE_URL || process.env.AUTH_URL || "http://localhost:3001"}/profile`,
        }),
      });

      await prisma.booking.updateMany({
        where: {
          id: confirmed.id,
          confirmationEmailSentAt: null,
        },
        data: {
          confirmationEmailSentAt: new Date(),
        },
      });
    } catch (e) {
      console.error("[booking-confirm] email send failed", {
        bookingId: confirmed.id,
        token: confirmed.publicToken,
        error: e instanceof Error ? e.message : String(e),
      });
    }
  }

  return apiOk({ token: confirmed.publicToken, status: confirmed.status });
}
