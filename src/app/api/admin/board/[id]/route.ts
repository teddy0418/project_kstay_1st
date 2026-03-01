import { apiError, apiOk } from "@/lib/api/response";
import { requireAdminUser } from "@/lib/auth/server";
import { deleteBoardPost, getBoardPostById, updateBoardPost, type BoardPostI18n } from "@/lib/repositories/board";

const LANGS = ["en", "ko", "ja", "zh"] as const;

function parseI18n(obj: unknown): BoardPostI18n | null {
  if (obj == null || typeof obj !== "object") return null;
  const out: Record<string, string> = {};
  for (const lang of LANGS) {
    const v = (obj as Record<string, unknown>)[lang];
    out[lang] = typeof v === "string" ? v : "";
  }
  return out as BoardPostI18n;
}

/** GET: 게시판 글 단일 (admin) */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await requireAdminUser();
    if (!admin) return apiError(403, "FORBIDDEN", "Admin access required");
    const { id } = await params;
    const post = await getBoardPostById(id);
    if (!post) return apiError(404, "NOT_FOUND", "Board post not found");
    return apiOk(post);
  } catch (err) {
    console.error("[api/admin/board/[id]] GET failed", err);
    return apiError(500, "INTERNAL_ERROR", "Failed to fetch board post");
  }
}

/** PUT: 게시판 글 수정 (admin) */
export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await requireAdminUser();
    if (!admin) return apiError(403, "FORBIDDEN", "Admin access required");
    const { id } = await params;
    const body = await req.json().catch(() => ({}));

    const data: { cover?: string; title?: BoardPostI18n; excerpt?: BoardPostI18n; content?: BoardPostI18n; sortOrder?: number } = {};
    if (typeof body.cover === "string") data.cover = body.cover.trim();
    const t = parseI18n(body.title);
    if (t) data.title = t;
    const e = parseI18n(body.excerpt);
    if (e) data.excerpt = e;
    const c = parseI18n(body.content);
    if (c) data.content = c;
    if (typeof body.sortOrder === "number") data.sortOrder = body.sortOrder;

    const post = await updateBoardPost(id, data);
    if (!post) return apiError(404, "NOT_FOUND", "Board post not found");
    return apiOk(post);
  } catch (err) {
    console.error("[api/admin/board/[id]] PUT failed", err);
    return apiError(500, "INTERNAL_ERROR", "Failed to update board post");
  }
}

/** DELETE: 게시판 글 삭제 (admin) */
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await requireAdminUser();
    if (!admin) return apiError(403, "FORBIDDEN", "Admin access required");
    const { id } = await params;
    await deleteBoardPost(id);
    return apiOk({ deleted: true });
  } catch (err) {
    console.error("[api/admin/board/[id]] DELETE failed", err);
    return apiError(500, "INTERNAL_ERROR", "Failed to delete board post");
  }
}
