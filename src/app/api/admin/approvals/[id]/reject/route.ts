import { apiError, apiOk } from "@/lib/api/response";
import { requireAdmin } from "@/lib/api/auth-guard";
import { findApprovalListingById, rejectListingById } from "@/lib/repositories/admin-approvals";

export async function POST(_: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireAdmin();
    if (!auth.ok) return auth.response;
    const admin = auth.user;

    const { id } = await ctx.params;
    if (!id) return apiError(400, "BAD_REQUEST", "listing id is required");

    const current = await findApprovalListingById(id);
    if (!current) return apiError(404, "NOT_FOUND", "Listing not found");
    if (current.status !== "PENDING") {
      return apiError(409, "CONFLICT", "Only PENDING listings can be rejected");
    }

    const listing = await rejectListingById(id);
    return apiOk(listing);
  } catch (error) {
    console.error("[api/admin/approvals/:id/reject] failed to reject listing", error);
    return apiError(500, "INTERNAL_ERROR", "Failed to reject listing");
  }
}
