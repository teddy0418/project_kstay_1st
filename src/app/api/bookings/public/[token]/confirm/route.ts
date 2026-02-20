import { apiError, apiOk } from "@/lib/api/response";
import { confirmMockBookingById, findBookingForMockConfirm } from "@/lib/repositories/payment-processing";
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

    const existing = await findBookingForMockConfirm(token);
    if (!existing) return apiError(404, "NOT_FOUND", "Booking not found");

    if (existing.status === "CONFIRMED") {
      return apiOk({ token, status: existing.status });
    }
    if (existing.status !== "PENDING_PAYMENT") {
      return apiError(409, "CONFLICT", "Booking cannot be confirmed in current status");
    }

    const confirmed = await confirmMockBookingById(existing.id);

    if (!existing.confirmationEmailSentAt && confirmed.guestEmail) {
      try {
        await sendBookingConfirmedEmailIfNeeded(confirmed.id);
      } catch (e) {
        console.error("[booking-confirm] email send failed", {
          bookingId: confirmed.id,
          token: confirmed.publicToken,
          error: e instanceof Error ? e.message : String(e),
        });
      }
    }

    return apiOk({ token: confirmed.publicToken, status: confirmed.status });
  } catch (error) {
    console.error("[api/bookings/public/:token/confirm] failed to confirm booking", error);
    return apiError(500, "INTERNAL_ERROR", "Failed to confirm booking");
  }
}
