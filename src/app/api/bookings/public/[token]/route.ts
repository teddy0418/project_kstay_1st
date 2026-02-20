import { apiError, apiOk } from "@/lib/api/response";
import { formatCancellationDeadlineKst, formatDateEn, formatUsdFromCents } from "@/lib/bookings/utils";
import { findPublicBookingByToken } from "@/lib/repositories/bookings";

export async function GET(_: Request, ctx: { params: Promise<{ token: string }> }) {
  try {
    const { token } = await ctx.params;
    if (!token) return apiError(400, "BAD_REQUEST", "Booking token is required");

    const booking = await findPublicBookingByToken(token);

    if (!booking) return apiError(404, "NOT_FOUND", "Booking not found");

    return apiOk({
      token: booking.publicToken,
      status: booking.status,
      listing: booking.listing,
      checkIn: booking.checkIn.toISOString(),
      checkOut: booking.checkOut.toISOString(),
      nights: booking.nights,
      guests: {
        adults: booking.guestsAdults,
        children: booking.guestsChildren,
        infants: booking.guestsInfants,
        pets: booking.guestsPets,
      },
      totals: {
        currency: booking.currency,
        usd: booking.totalUsd,
        krw: booking.totalKrw,
        usdText: formatUsdFromCents(booking.totalUsd),
      },
      checkInText: formatDateEn(booking.checkIn),
      checkOutText: formatDateEn(booking.checkOut),
      cancellationDeadlineKst: formatCancellationDeadlineKst(booking.cancellationDeadlineKst),
      createdAt: booking.createdAt.toISOString(),
      confirmedAt: booking.confirmedAt?.toISOString() ?? null,
    });
  } catch (error) {
    console.error("[api/bookings/public/:token] failed to fetch booking", error);
    return apiError(500, "INTERNAL_ERROR", "Failed to fetch booking");
  }
}
