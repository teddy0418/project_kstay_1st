import { apiError, apiOk } from "@/lib/api/response";
import { requireAdminUser } from "@/lib/auth/server";
import { findApprovalListingById, rejectListingById } from "@/lib/repositories/admin-approvals";

export async function POST(_: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const admin = await requireAdminUser();
    if (!admin) return apiError(403, "FORBIDDEN", "Admin access required");

    const { id } = await ctx.params;
    if (!id) return apiError(400, "BAD_REQUEST", "listing id is required");

    const current = await findApprovalListingById(id);
    if (!current) return apiError(404, "NOT_FOUND", "Listing not found");

    const listing = await rejectListingById(id);
    return apiOk(listing);
  } catch (error) {
    console.error("[api/admin/approvals/:id/reject] failed to reject listing", error);
    return apiError(500, "INTERNAL_ERROR", "Failed to reject listing");
  }
}
