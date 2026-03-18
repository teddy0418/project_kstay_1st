import { getServerSessionUser } from "@/lib/auth/server";
import { requireAdmin } from "@/lib/api/auth-guard";
import { apiError, apiOk } from "@/lib/api/response";
import { approveListingById, findApprovalListingById } from "@/lib/repositories/admin-approvals";

export async function POST(_: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const sessionUser = await getServerSessionUser();
    if (!sessionUser) return apiError(401, "UNAUTHORIZED", "Login required");

    const auth = await requireAdmin();
    if (!auth.ok) return auth.response;
    const admin = auth.user;

    const { id } = await ctx.params;
    if (!id) return apiError(400, "BAD_REQUEST", "listing id is required");

    const current = await findApprovalListingById(id);
    if (!current) return apiError(404, "NOT_FOUND", "Listing not found");
    if (current.status !== "PENDING") {
      return apiError(409, "CONFLICT", "Only PENDING listings can be approved");
    }

    const listing = await approveListingById(id);

    return apiOk(listing);
  } catch (error) {
    console.error("[api/admin/approvals/:id/approve] failed to approve listing", error);
    return apiError(500, "INTERNAL_ERROR", "Failed to approve listing");
  }
}
