import React from "react";
import { Webhook } from "@portone/server-sdk";
import { prisma } from "@/lib/db";
import { formatCancellationDeadlineKst, formatDateEn, formatUsdFromCents } from "@/lib/bookings/utils";
import BookingConfirmedEmail from "@/emails/BookingConfirmedEmail";
import { sendEmailWithResend } from "@/lib/email/resend";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const webhookSecret = String(process.env.PORTONE_WEBHOOK_SECRET ?? "").trim();
  if (!webhookSecret) {
    return new Response("PORTONE_WEBHOOK_SECRET is missing", { status: 500 });
  }

  const webhookId = req.headers.get("webhook-id") || "";
  const webhookSignature = req.headers.get("webhook-signature") || "";
  const webhookTimestamp = req.headers.get("webhook-timestamp") || "";
  if (!webhookId || !webhookSignature || !webhookTimestamp) {
    return new Response("Missing webhook headers", { status: 400 });
  }

  const payloadRaw = await req.text();

  let verified: Awaited<ReturnType<typeof Webhook.verify>>;
  try {
    verified = await Webhook.verify(webhookSecret, payloadRaw, {
      "webhook-id": webhookId,
      "webhook-signature": webhookSignature,
      "webhook-timestamp": webhookTimestamp,
    });
  } catch {
    return new Response("Invalid webhook signature", { status: 400 });
  }

  const parsedType = getWebhookType(verified);
  const paymentId = getWebhookPaymentId(verified);

  try {
    await prisma.paymentWebhookEvent.create({
      data: {
        provider: "PORTONE",
        webhookId,
        webhookTimestamp,
        webhookSignature,
        payloadRaw,
        parsedType,
        paymentId,
      },
    });
  } catch (e) {
    if (isUniqueConflict(e)) {
      return new Response("OK (duplicate webhook)", { status: 200 });
    }
    console.error("[portone-webhook] failed to persist webhook event", e);
    return new Response("Failed to persist webhook event", { status: 500 });
  }

  if (!paymentId) {
    return new Response("OK", { status: 200 });
  }

  try {
    await syncPaymentAndBookingFromPortOne(paymentId);
  } catch (e) {
    console.error("[portone-webhook] processing failed", {
      paymentId,
      error: e instanceof Error ? e.message : String(e),
    });
  }

  return new Response("OK", { status: 200 });
}

function getWebhookType(webhook: Awaited<ReturnType<typeof Webhook.verify>>): string | null {
  if (Webhook.isUnrecognizedWebhook(webhook)) return null;
  return typeof webhook.type === "string" ? webhook.type : null;
}

function getWebhookPaymentId(webhook: Awaited<ReturnType<typeof Webhook.verify>>): string | null {
  if (Webhook.isUnrecognizedWebhook(webhook)) return null;
  if (!("data" in webhook)) return null;
  const data = (webhook as { data?: { paymentId?: unknown } }).data;
  if (!data) return null;
  return typeof data.paymentId === "string" ? data.paymentId : null;
}

function isUniqueConflict(error: unknown) {
  if (typeof error !== "object" || !error) return false;
  const code = (error as { code?: unknown }).code;
  return code === "P2002";
}

async function syncPaymentAndBookingFromPortOne(paymentId: string) {
  const apiSecret = String(process.env.PORTONE_API_SECRET ?? "").trim();
  if (!apiSecret) {
    throw new Error("PORTONE_API_SECRET is missing");
  }

  const response = await fetch(`https://api.portone.io/payments/${encodeURIComponent(paymentId)}`, {
    method: "GET",
    headers: {
      Authorization: `PortOne ${apiSecret}`,
    },
    cache: "no-store",
  });

  const paymentRawJson = await response.text();
  if (!response.ok) {
    throw new Error(`Failed to fetch payment from PortOne (${response.status})`);
  }

  const parsed = safeParseJson(paymentRawJson);
  const paymentStatus = typeof parsed?.status === "string" ? parsed.status.toUpperCase() : "";
  const pgTid = typeof parsed?.transactionId === "string" ? parsed.transactionId : null;
  const storeId = typeof parsed?.storeId === "string" ? parsed.storeId : null;

  const booking = await prisma.booking.findUnique({
    where: { publicToken: paymentId },
    include: {
      listing: { select: { title: true } },
      payments: { orderBy: { createdAt: "asc" } },
    },
  });
  if (!booking) return;

  const targetPayment = booking.payments.find((p) => p.providerPaymentId === paymentId) ?? booking.payments[0];

  if (paymentStatus === "PAID") {
    const confirmed = await prisma.$transaction(async (tx) => {
      const updatedBooking = await tx.booking.update({
        where: { id: booking.id },
        data: {
          status: "CONFIRMED",
          confirmedAt: booking.confirmedAt ?? new Date(),
        },
        include: {
          listing: { select: { title: true } },
        },
      });

      if (targetPayment) {
        await tx.payment.update({
          where: { id: targetPayment.id },
          data: {
            status: "PAID",
            paidAt: new Date(),
            providerPaymentId: paymentId,
            storeId,
            pgTid,
            rawJson: paymentRawJson,
          },
        });
      }

      return updatedBooking;
    });

    await sendBookingConfirmedEmailIfNeeded(confirmed.id);
    return;
  }

  if (paymentStatus === "FAILED" || paymentStatus === "CANCELLED" || paymentStatus === "PARTIAL_CANCELLED") {
    await prisma.$transaction(async (tx) => {
      await tx.booking.update({
        where: { id: booking.id },
        data: {
          status: "CANCELLED",
        },
      });

      if (targetPayment) {
        await tx.payment.update({
          where: { id: targetPayment.id },
          data: {
            status: paymentStatus === "FAILED" ? "FAILED" : "CANCELLED",
            providerPaymentId: paymentId,
            storeId,
            pgTid,
            rawJson: paymentRawJson,
          },
        });
      }
    });
    return;
  }

  if (targetPayment) {
    await prisma.payment.update({
      where: { id: targetPayment.id },
      data: {
        status: "INITIATED",
        providerPaymentId: paymentId,
        storeId,
        pgTid,
        rawJson: paymentRawJson,
      },
    });
  }
}

function safeParseJson(value: string): { status?: unknown; transactionId?: unknown; storeId?: unknown } | null {
  try {
    return JSON.parse(value) as { status?: unknown; transactionId?: unknown; storeId?: unknown };
  } catch {
    return null;
  }
}

async function sendBookingConfirmedEmailIfNeeded(bookingId: string) {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      listing: { select: { title: true } },
    },
  });
  if (!booking || booking.confirmationEmailSentAt || !booking.guestEmail) return;

  try {
    await sendEmailWithResend({
      to: booking.guestEmail,
      subject: "KSTAY booking confirmed",
      react: React.createElement(BookingConfirmedEmail, {
        bookingToken: booking.publicToken,
        listingTitle: booking.listing.title,
        checkIn: formatDateEn(booking.checkIn),
        checkOut: formatDateEn(booking.checkOut),
        guestsText: `${booking.guestsAdults} adults, ${booking.guestsChildren} children, ${booking.guestsInfants} infants, ${booking.guestsPets} pets`,
        totalText: `${formatUsdFromCents(booking.totalUsd)} / ₩${booking.totalKrw.toLocaleString()}`,
        cancellationDeadlineKst: formatCancellationDeadlineKst(booking.cancellationDeadlineKst),
        manageUrl: `${process.env.NEXT_PUBLIC_SITE_URL || process.env.AUTH_URL || "http://localhost:3001"}/profile`,
      }),
    });

    await prisma.booking.updateMany({
      where: {
        id: booking.id,
        confirmationEmailSentAt: null,
      },
      data: {
        confirmationEmailSentAt: new Date(),
      },
    });
  } catch (e) {
    console.error("[portone-webhook] email send failed", {
      bookingId: booking.id,
      token: booking.publicToken,
      error: e instanceof Error ? e.message : String(e),
    });
  }
}
