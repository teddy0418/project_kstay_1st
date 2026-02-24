import { apiError, apiOk } from "@/lib/api/response";
import { requireAdminUser } from "@/lib/auth/server";
import { getAdminSettlementRows } from "@/lib/repositories/admin-settlements";

/** GET: 관리자용 정산 대상 목록 (CONFIRMED 예약 + 결제정보, readyAt 포함) */
export async function GET() {
  try {
    const admin = await requireAdminUser();
    if (!admin) return apiError(403, "FORBIDDEN", "Admin access required");

    const rows = await getAdminSettlementRows();
    return apiOk(rows);
  } catch (err) {
    console.error("[api/admin/settlements] GET failed", err);
    return apiError(500, "INTERNAL_ERROR", "Failed to fetch settlements");
  }
}
