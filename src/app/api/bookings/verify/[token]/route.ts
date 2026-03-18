import { apiError, apiOk } from "@/lib/api/response";
import {
  createBookingFromCheckoutSession,
  findCheckoutSessionByToken,
} from "@/lib/repositories/checkout-session";
import { findBookingForPaymentSync } from "@/lib/repositories/payment-processing";
import { sendBookingConfirmedEmailIfNeeded } from "@/lib/services/booking-confirmation-email";

export const runtime = "nodejs";

/**
 * POST /api/bookings/verify/[token]
 *
 * Webhook 미도착 시 클라이언트가 직접 결제 상태를 확인하고
 * 결제 완료 상태라면 예약을 생성하는 복구 경로.
 */
export async function POST(_: Request, ctx: { params: Promise<{ token: string }> }) {
  const { token } = await ctx.params;
  if (!token) return apiError(400, "BAD_REQUEST", "Token is required");

  const existing = await findBookingForPaymentSync(token);
  if (existing) {
    return apiOk({ status: existing.status, recovered: false });
  }

  const session = await findCheckoutSessionByToken(token);
  if (!session) {
    return apiError(404, "NOT_FOUND", "No checkout session or booking found");
  }

  const apiSecret = String(process.env.PORTONE_API_SECRET ?? "").trim();
  if (!apiSecret) {
    return apiError(500, "CONFIG_ERROR", "Payment verification unavailable");
  }

  let portoneStatus = "";
  let pgTid: string | null = null;
  let storeId: string | null = null;
  let paymentRawJson = "";
  try {
    const res = await fetch(
      `https://api.portone.io/payments/${encodeURIComponent(token)}`,
      {
        headers: { Authorization: `PortOne ${apiSecret}` },
        cache: "no-store",
      }
    );
    paymentRawJson = await res.text();
    if (!res.ok) {
      return apiOk({ status: "PENDING_PAYMENT", recovered: false, portoneStatus: "FETCH_FAILED" });
    }
    const parsed = JSON.parse(paymentRawJson) as {
      status?: string;
      transactionId?: string;
      storeId?: string;
    };
    portoneStatus = (parsed.status ?? "").toUpperCase();
    pgTid = parsed.transactionId ?? null;
    storeId = parsed.storeId ?? null;
  } catch {
    return apiOk({ status: "PENDING_PAYMENT", recovered: false, portoneStatus: "ERROR" });
  }

  if (portoneStatus !== "PAID") {
    return apiOk({ status: "PENDING_PAYMENT", recovered: false, portoneStatus });
  }

  try {
    const created = await createBookingFromCheckoutSession(token, {
      paymentId: token,
      storeId,
      pgTid,
      paymentRawJson,
    });
    if (created) {
      await sendBookingConfirmedEmailIfNeeded(created.id);
      return apiOk({ status: "CONFIRMED", recovered: true });
    }
    return apiOk({ status: "PENDING_PAYMENT", recovered: false, portoneStatus: "SESSION_GONE" });
  } catch (err) {
    console.error("[bookings/verify] recovery booking creation failed", {
      token,
      error: err instanceof Error ? err.message : String(err),
    });
    return apiError(500, "INTERNAL_ERROR", "Failed to create booking from verified payment");
  }
}
