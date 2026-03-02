import { apiError, apiOk } from "@/lib/api/response";
import { requireAdminUser } from "@/lib/auth/server";
import {
  deleteHostAnnouncement,
  getHostAnnouncementById,
  updateHostAnnouncement,
} from "@/lib/repositories/host-announcements";

/** GET: 단일 호스트 공지 (admin) */
export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAdminUser();
    if (!admin) return apiError(403, "FORBIDDEN", "Admin 권한이 필요합니다.");
    const { id } = await ctx.params;
    const item = await getHostAnnouncementById(id);
    if (!item) return apiError(404, "NOT_FOUND", "공지를 찾을 수 없습니다.");
    return apiOk(item);
  } catch (err) {
    console.error("[api/admin/host-announcements/[id]] GET failed", err);
    return apiError(500, "INTERNAL_ERROR", "조회에 실패했습니다.");
  }
}

/** PUT: 호스트 공지 수정 (admin) */
export async function PUT(
  req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAdminUser();
    if (!admin) return apiError(403, "FORBIDDEN", "Admin 권한이 필요합니다.");
    const { id } = await ctx.params;
    const body = await req.json().catch(() => ({}));
    const data: { type?: string; title?: string; body?: string | null; sortOrder?: number } = {};
    if (typeof body.type === "string") data.type = body.type.trim();
    if (typeof body.title === "string") data.title = body.title.trim();
    if (body.body !== undefined) data.body = typeof body.body === "string" ? body.body.trim() || null : null;
    if (typeof body.sortOrder === "number") data.sortOrder = body.sortOrder;

    const item = await updateHostAnnouncement(id, data);
    if (!item) return apiError(404, "NOT_FOUND", "공지를 찾을 수 없습니다.");
    return apiOk(item);
  } catch (err) {
    console.error("[api/admin/host-announcements/[id]] PUT failed", err);
    return apiError(500, "INTERNAL_ERROR", "수정에 실패했습니다.");
  }
}

/** DELETE: 호스트 공지 삭제 (admin) */
export async function DELETE(
  _req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAdminUser();
    if (!admin) return apiError(403, "FORBIDDEN", "Admin 권한이 필요합니다.");
    const { id } = await ctx.params;
    await deleteHostAnnouncement(id);
    return apiOk({ ok: true });
  } catch (err) {
    console.error("[api/admin/host-announcements/[id]] DELETE failed", err);
    return apiError(500, "INTERNAL_ERROR", "삭제에 실패했습니다.");
  }
}
