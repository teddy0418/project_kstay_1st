import { apiError, apiOk } from "@/lib/api/response";
import { requireAdminUser } from "@/lib/auth/server";
import { getAdminListings } from "@/lib/repositories/admin-listings";
import { getApprovedListingsFromDb } from "@/lib/repositories/listings";

/** GET: 관리자용. ?status=DRAFT|PENDING|APPROVED|REJECTED → 해당 상태 목록. ?approvedOnly=1 → 테스트 리뷰용 승인 숙소(전체 필드). 없으면 전체. */
export async function GET(req: Request) {
  try {
    const admin = await requireAdminUser();
    if (!admin) return apiError(403, "FORBIDDEN", "Admin access required");

    const url = new URL(req.url);
    const approvedOnly = url.searchParams.get("approvedOnly") === "1";
    if (approvedOnly) {
      const listings = await getApprovedListingsFromDb();
      return apiOk(listings);
    }
    const status = url.searchParams.get("status") ?? undefined;
    const listings = await getAdminListings(status);
    return apiOk(listings);
  } catch (err) {
    console.error("[api/admin/listings] GET failed", err);
    return apiError(500, "INTERNAL_ERROR", "Failed to fetch listings");
  }
}
