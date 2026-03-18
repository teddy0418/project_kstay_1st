import { getServerSessionUser } from "@/lib/auth/server";
import { requireAdmin } from "@/lib/api/auth-guard";
import { apiError, apiOk } from "@/lib/api/response";
import { getPendingApprovalItems } from "@/lib/repositories/admin-approvals";

export async function GET() {
  try {
    const sessionUser = await getServerSessionUser();
    if (!sessionUser) return apiError(401, "UNAUTHORIZED", "Login required");

    const auth = await requireAdmin();
    if (!auth.ok) return auth.response;
    const admin = auth.user;

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
