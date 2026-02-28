import { apiError, apiOk } from "@/lib/api/response";
import { requireAdminUser } from "@/lib/auth/server";
import { getAdminBookings } from "@/lib/repositories/admin-bookings";

/** GET: 관리자용 예약 목록. query status, page, pageSize (기본 10개씩) */
export async function GET(req: Request) {
  try {
    const admin = await requireAdminUser();
    if (!admin) return apiError(403, "FORBIDDEN", "Admin access required");

    const url = new URL(req.url);
    const status = url.searchParams.get("status") ?? undefined;
    const pageParam = url.searchParams.get("page");
    const pageSizeParam = url.searchParams.get("pageSize");
    const page = pageParam ? Math.max(1, parseInt(pageParam, 10) || 1) : 1;
    const pageSize = pageSizeParam ? Math.min(100, Math.max(1, parseInt(pageSizeParam, 10) || 10)) : 10;

    const { bookings, total } = await getAdminBookings(status, { page, pageSize });
    return apiOk({ bookings, total, page, pageSize });
  } catch (err) {
    console.error("[api/admin/bookings] GET failed", err);
    return apiError(500, "INTERNAL_ERROR", "Failed to fetch bookings");
  }
}
