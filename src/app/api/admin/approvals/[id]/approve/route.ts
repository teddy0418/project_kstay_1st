import { getServerSessionUser, requireAdminUser } from "@/lib/auth/server";
import { apiError, apiOk } from "@/lib/api/response";
import { approveListingById, findApprovalListingById } from "@/lib/repositories/admin-approvals";

export async function POST(_: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const sessionUser = await getServerSessionUser();
    if (!sessionUser) return apiError(401, "UNAUTHORIZED", "Login required");

    const admin = await requireAdminUser();
    if (!admin) return apiError(403, "FORBIDDEN", "Admin access required");

    const { id } = await ctx.params;
    if (!id) return apiError(400, "BAD_REQUEST", "listing id is required");

    const current = await findApprovalListingById(id);
    if (!current) return apiError(404, "NOT_FOUND", "Listing not found");

    const listing = await approveListingById(id);

    return apiOk(listing);
  } catch (error) {
    console.error("[api/admin/approvals/:id/approve] failed to approve listing", error);
    return apiError(500, "INTERNAL_ERROR", "Failed to approve listing");
  }
}
