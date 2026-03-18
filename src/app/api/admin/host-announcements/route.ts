import { apiError, apiOk } from "@/lib/api/response";
import { requireAdmin } from "@/lib/api/auth-guard";
import { createHostAnnouncement, getHostAnnouncements } from "@/lib/repositories/host-announcements";

/** GET: 호스트 공지 목록 (admin) */
export async function GET() {
  try {
    const auth = await requireAdmin();
    if (!auth.ok) return auth.response;
    const admin = auth.user;
    const list = await getHostAnnouncements();
    return apiOk(list);
  } catch (err) {
    console.error("[api/admin/host-announcements] GET failed", err);
    return apiError(500, "INTERNAL_ERROR", "목록 조회에 실패했습니다.");
  }
}

/** POST: 호스트 공지 등록 (admin, 한국어) */
export async function POST(req: Request) {
  try {
    const auth = await requireAdmin();
    if (!auth.ok) return auth.response;
    const admin = auth.user;

    const body = await req.json().catch(() => ({}));
    const type = typeof body.type === "string" ? body.type.trim() : "";
    const title = typeof body.title === "string" ? body.title.trim() : "";
    const bodyText = typeof body.body === "string" ? body.body.trim() : null;
    const sortOrder = typeof body.sortOrder === "number" ? body.sortOrder : 0;

    if (!type || !title) return apiError(400, "BAD_REQUEST", "type(공지/팁/가이드), title은 필수입니다.");

    const item = await createHostAnnouncement({ type, title, body: bodyText || null, sortOrder });
    return apiOk(item);
  } catch (err) {
    console.error("[api/admin/host-announcements] POST failed", err);
    return apiError(500, "INTERNAL_ERROR", "등록에 실패했습니다.");
  }
}
