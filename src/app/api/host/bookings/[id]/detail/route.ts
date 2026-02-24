import { getOrCreateServerUser } from "@/lib/auth/server";
import { getBookingDetailForHost } from "@/lib/repositories/host-calendar";
import { apiError, apiOk } from "@/lib/api/response";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getOrCreateServerUser();
    if (!user) return apiError(401, "UNAUTHORIZED", "Not logged in");
    const { id: bookingId } = await params;
    if (!bookingId) return apiError(400, "BAD_REQUEST", "Booking ID required");

    const detail = await getBookingDetailForHost(bookingId, user.id);
    if (!detail) return apiError(404, "NOT_FOUND", "Booking not found");
    return apiOk(detail);
  } catch (e) {
    console.error("[GET /api/host/bookings/[id]/detail]", e);
    return apiError(500, "INTERNAL_ERROR", "Failed to load booking detail");
  }
}
