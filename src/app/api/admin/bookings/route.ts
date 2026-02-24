import { apiError, apiOk } from "@/lib/api/response";
import { requireAdminUser } from "@/lib/auth/server";
import { getAdminBookings } from "@/lib/repositories/admin-bookings";

/** GET: 관리자용 예약 목록. query status = PENDING_PAYMENT | CONFIRMED | CANCELLED (없으면 전체) */
export async function GET(req: Request) {
  try {
    const admin = await requireAdminUser();
    if (!admin) return apiError(403, "FORBIDDEN", "Admin access required");

    const url = new URL(req.url);
    const status = url.searchParams.get("status") ?? undefined;
    const bookings = await getAdminBookings(status);
    return apiOk(bookings);
  } catch (err) {
    console.error("[api/admin/bookings] GET failed", err);
    return apiError(500, "INTERNAL_ERROR", "Failed to fetch bookings");
  }
}
