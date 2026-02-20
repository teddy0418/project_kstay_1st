import { Webhook } from "@portone/server-sdk";
import {
  applyFailedOrCancelledPaymentSync,
  applyInitiatedPaymentSync,
  applyPaidPaymentSync,
  createPortoneWebhookEvent,
  findBookingForPaymentSync,
} from "@/lib/repositories/payment-processing";
import { sendBookingConfirmedEmailIfNeeded } from "@/lib/services/booking-confirmation-email";

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

  const booking = await findBookingForPaymentSync(paymentId);
  if (!booking) return;

  const targetPayment =
    booking.payments.find((p) => p.providerPaymentId === paymentId) ??
    booking.payments[0];

  if (paymentStatus === "PAID") {
    const confirmed = await applyPaidPaymentSync({
      bookingId: booking.id,
      currentConfirmedAt: booking.confirmedAt,
      paymentRowId: targetPayment?.id,
      paymentId,
      storeId,
      pgTid,
      paymentRawJson,
    });

    await sendBookingConfirmedEmailIfNeeded(confirmed.id);
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

function safeParseJson(value: string): { status?: unknown; transactionId?: unknown; storeId?: unknown } | null {
  try {
    return JSON.parse(value) as { status?: unknown; transactionId?: unknown; storeId?: unknown };
  } catch {
    return null;
  }
}

