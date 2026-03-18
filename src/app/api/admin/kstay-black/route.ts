import { apiError, apiOk } from "@/lib/api/response";
import { requireAdmin } from "@/lib/api/auth-guard";
import {
  getKstayBlackListingsForAdmin,
  setKstayBlackSortOrder,
  getNextKstayBlackSortOrder,
} from "@/lib/repositories/admin-listings";

/** GET: KSTAY Black 선정 목록 */
export async function GET() {
  try {
    const auth = await requireAdmin();
    if (!auth.ok) return auth.response;
    const admin = auth.user;
    const list = await getKstayBlackListingsForAdmin();
    return apiOk(list);
  } catch (e) {
    console.error("[api/admin/kstay-black] GET", e);
    return apiError(500, "INTERNAL_ERROR", "Failed to fetch");
  }
}

/** POST: KSTAY Black 선정 추가. body: { listingId: string } */
export async function POST(req: Request) {
  try {
    const auth = await requireAdmin();
    if (!auth.ok) return auth.response;
    const admin = auth.user;
    const body = await req.json().catch(() => ({}));
    const listingId = typeof body.listingId === "string" ? body.listingId.trim() : "";
    if (!listingId) return apiError(400, "BAD_REQUEST", "listingId required");
    const nextOrder = await getNextKstayBlackSortOrder();
    const ok = await setKstayBlackSortOrder(listingId, nextOrder);
    if (!ok) return apiError(404, "NOT_FOUND", "Approved listing not found");
    return apiOk({ listingId, kstayBlackSortOrder: nextOrder });
  } catch (e) {
    console.error("[api/admin/kstay-black] POST", e);
    return apiError(500, "INTERNAL_ERROR", "Failed to add");
  }
}
