import { apiError, apiOk } from "@/lib/api/response";
import { requireAdminUser } from "@/lib/auth/server";
import { setKstayBlackSortOrder } from "@/lib/repositories/admin-listings";

/** DELETE: KSTAY Black 선정 해제 */
export async function DELETE(
  _req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAdminUser();
    if (!admin) return apiError(403, "FORBIDDEN", "Admin required");
    const { id: listingId } = await ctx.params;
    if (!listingId) return apiError(400, "BAD_REQUEST", "id required");
    const ok = await setKstayBlackSortOrder(listingId, null);
    if (!ok) return apiError(404, "NOT_FOUND", "Listing not found");
    return apiOk({ removed: true });
  } catch (e) {
    console.error("[api/admin/kstay-black/:id] DELETE", e);
    return apiError(500, "INTERNAL_ERROR", "Failed to remove");
  }
}
