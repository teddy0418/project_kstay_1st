import { apiError, apiOk } from "@/lib/api/response";
import {
  createBookingFromCheckoutSession,
  findCheckoutSessionByToken,
} from "@/lib/repositories/checkout-session";
import { findBookingForMockConfirm } from "@/lib/repositories/payment-processing";
import { sendBookingConfirmedEmailIfNeeded } from "@/lib/services/booking-confirmation-email";

export const runtime = "nodejs";

export async function POST(_: Request, ctx: { params: Promise<{ token: string }> }) {
  try {
    const providerMode = (process.env.PAYMENT_PROVIDER || "MOCK").toUpperCase();
    if (providerMode !== "MOCK") {
      return apiError(403, "FORBIDDEN", "Mock confirm endpoint is disabled for this payment provider");
    }

    const { token } = await ctx.params;
    if (!token) return apiError(400, "BAD_REQUEST", "Booking token is required");

    const existingBooking = await findBookingForMockConfirm(token);
    if (existingBooking) {
      if (existingBooking.status === "CONFIRMED") {
        return apiOk({ token, status: existingBooking.status });
      }
      return apiError(409, "CONFLICT", "Booking cannot be confirmed in current status");
    }

    const session = await findCheckoutSessionByToken(token);
    if (!session) return apiError(404, "NOT_FOUND", "Checkout session not found or expired");

    const confirmed = await createBookingFromCheckoutSession(token, {
      paymentId: token,
      storeId: null,
      pgTid: null,
      paymentRawJson: JSON.stringify({ status: "PAID", provider: "MOCK" }),
    });
    if (!confirmed) return apiError(500, "INTERNAL_ERROR", "Failed to create booking from session");

    try {
      await sendBookingConfirmedEmailIfNeeded(confirmed.id);
    } catch (e) {
      console.error("[booking-confirm] email send failed", {
        bookingId: confirmed.id,
        token: confirmed.publicToken,
        error: e instanceof Error ? e.message : String(e),
      });
    }

    return apiOk({ token: confirmed.publicToken, status: confirmed.status });
  } catch (error) {
    console.error("[api/bookings/public/:token/confirm] failed to confirm booking", error);
    return apiError(500, "INTERNAL_ERROR", "Failed to confirm booking");
  }
}
