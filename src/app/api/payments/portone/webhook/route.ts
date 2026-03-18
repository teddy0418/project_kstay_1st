import { Webhook } from "@portone/server-sdk";
import {
  createBookingFromCheckoutSession,
  findCheckoutSessionByToken,
} from "@/lib/repositories/checkout-session";
import {
  applyFailedOrCancelledPaymentSync,
  applyInitiatedPaymentSync,
  applyPaidPaymentSync,
  createPortoneWebhookEvent,
  findBookingForPaymentSync,
} from "@/lib/repositories/payment-processing";
import { sendBookingConfirmedEmailIfNeeded } from "@/lib/services/booking-confirmation-email";
import { cancelPortonePayment } from "@/lib/portone/cancel";

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
    await createPortoneWebhookEvent({
      webhookId,
      webhookTimestamp,
      webhookSignature,
      payloadRaw,
      parsedType,
      paymentId,
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
    return new Response("Processing failed", { status: 500 });
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
  const portoneAmount = typeof parsed?.amount === "number" ? parsed.amount : null;
  const portoneCurrency = typeof parsed?.currency === "string" ? parsed.currency.toUpperCase() : "";

  let booking = await findBookingForPaymentSync(paymentId);
  if (!booking) {
    const session = await findCheckoutSessionByToken(paymentId);
    if (!session) return;
    if (paymentStatus === "PAID") {
      const p = session.payload as { totalKrw: number; totalUsd: number };
      if (!verifyAmountMatchesSession(p, portoneAmount, portoneCurrency)) {
        console.warn("[portone-webhook] amount mismatch for checkout session", { paymentId });
        await autoRefund(paymentId, "Amount mismatch between PortOne and checkout session");
        return;
      }
      try {
        const created = await createBookingFromCheckoutSession(paymentId, {
          paymentId,
          storeId,
          pgTid,
          paymentRawJson: paymentRawJson,
        });
        if (created) await sendBookingConfirmedEmailIfNeeded(created.id);
      } catch (bookingErr) {
        console.error("[portone-webhook] booking creation failed, initiating auto-refund", {
          paymentId,
          error: bookingErr instanceof Error ? bookingErr.message : String(bookingErr),
        });
        await autoRefund(paymentId, "Booking creation failed after payment");
        throw bookingErr;
      }
    }
    return;
  }

  const targetPayment =
    booking.payments.find((p) => p.providerPaymentId === paymentId) ??
    booking.payments[0];

  if (paymentStatus === "PAID") {
    if (booking.status === "CANCELLED") {
      console.warn("[portone-webhook] payment arrived for already expired/cancelled booking", {
        paymentId,
        bookingId: booking.id,
      });
      return;
    }
    if (!verifyAmountMatches(booking, targetPayment, portoneAmount, portoneCurrency)) {
      console.warn("[portone-webhook] amount mismatch, skipping confirmation", {
        paymentId,
        portoneAmount,
        portoneCurrency,
        bookingTotalKrw: booking.totalKrw,
        bookingTotalUsd: booking.totalUsd,
      });
      return;
    }
    const confirmed = await applyPaidPaymentSync({
      bookingId: booking.id,
      currentConfirmedAt: booking.confirmedAt,
      paymentRowId: targetPayment?.id,
      paymentId,
      storeId,
      pgTid,
      paymentRawJson,
    });

    if (confirmed) await sendBookingConfirmedEmailIfNeeded(confirmed.id);
    return;
  }

  if (paymentStatus === "FAILED" || paymentStatus === "CANCELLED" || paymentStatus === "PARTIAL_CANCELLED") {
    await applyFailedOrCancelledPaymentSync({
      bookingId: booking.id,
      paymentRowId: targetPayment?.id,
      paymentStatus: paymentStatus === "FAILED" ? "FAILED" : "CANCELLED",
      paymentId,
      storeId,
      pgTid,
      paymentRawJson,
    });
    return;
  }

  if (targetPayment) {
    await applyInitiatedPaymentSync({
      paymentRowId: targetPayment.id,
      paymentId,
      storeId,
      pgTid,
      paymentRawJson,
    });
  }
}

function verifyAmountMatches(
  booking: { totalKrw: number; totalUsd: number },
  payment: { amountKrw: number | null } | undefined,
  portoneAmount: number | null,
  portoneCurrency: string
): boolean {
  if (portoneAmount == null) return true;
  if (portoneCurrency === "KRW") {
    const expected = payment?.amountKrw ?? booking.totalKrw;
    return portoneAmount === expected;
  }
  if (portoneCurrency === "USD") {
    return portoneAmount === booking.totalUsd;
  }
  return true;
}

function verifyAmountMatchesSession(
  payload: { totalKrw: number; totalUsd: number },
  portoneAmount: number | null,
  portoneCurrency: string
): boolean {
  if (portoneAmount == null) return true;
  if (portoneCurrency === "KRW") return portoneAmount === payload.totalKrw;
  if (portoneCurrency === "USD") return portoneAmount === payload.totalUsd;
  return true;
}

async function autoRefund(paymentId: string, reason: string) {
  try {
    const result = await cancelPortonePayment(paymentId, `[auto-refund] ${reason}`);
    if (result.ok) {
      console.info("[portone-webhook] auto-refund succeeded", { paymentId });
    } else {
      console.error("[portone-webhook] auto-refund failed", { paymentId, reason: result.reason });
    }
  } catch (refundErr) {
    console.error("[portone-webhook] auto-refund threw", {
      paymentId,
      error: refundErr instanceof Error ? refundErr.message : String(refundErr),
    });
  }
}

function safeParseJson(value: string): {
  status?: unknown;
  transactionId?: unknown;
  storeId?: unknown;
  amount?: unknown;
  currency?: unknown;
} | null {
  try {
    return JSON.parse(value) as {
      status?: unknown;
      transactionId?: unknown;
      storeId?: unknown;
      amount?: unknown;
      currency?: unknown;
    };
  } catch {
    return null;
  }
}

