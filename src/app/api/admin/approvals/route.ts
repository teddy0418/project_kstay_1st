import { getServerSessionUser, requireAdminUser } from "@/lib/auth/server";
import { apiError, apiOk } from "@/lib/api/response";
import { getPendingApprovalItems } from "@/lib/repositories/admin-approvals";

export async function GET() {
  try {
    const sessionUser = await getServerSessionUser();
    if (!sessionUser) return apiError(401, "UNAUTHORIZED", "Login required");

    const admin = await requireAdminUser();
    if (!admin) return apiError(403, "FORBIDDEN", "Admin access required");

    const items = await getPendingApprovalItems();

    return apiOk(
      items.map((item) => ({
        id: item.id,
        title: item.title,
        city: item.city,
        area: item.area,
        address: item.address,
        basePriceKrw: item.basePriceKrw,
        status: item.status,
        createdAt: item.createdAt,
        host: item.host,
      }))
    );
  } catch (error) {
    console.error("[api/admin/approvals] failed to fetch pending approvals", error);
    return apiError(500, "INTERNAL_ERROR", "Failed to fetch pending approvals");
  }
}
