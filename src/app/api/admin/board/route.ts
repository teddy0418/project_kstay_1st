import { apiError, apiOk } from "@/lib/api/response";
import { requireAdminUser } from "@/lib/auth/server";
import { createBoardPost, getBoardPosts, type BoardPostI18n } from "@/lib/repositories/board";

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

/** GET: 게시판 글 목록 (admin) */
export async function GET() {
  try {
    const admin = await requireAdminUser();
    if (!admin) return apiError(403, "FORBIDDEN", "Admin access required");
    const posts = await getBoardPosts();
    return apiOk(posts);
  } catch (err) {
    console.error("[api/admin/board] GET failed", err);
    return apiError(500, "INTERNAL_ERROR", "Failed to fetch board posts");
  }
}

/** POST: 게시판 글 생성 (admin) */
export async function POST(req: Request) {
  try {
    const admin = await requireAdminUser();
    if (!admin) return apiError(403, "FORBIDDEN", "Admin access required");

    const body = await req.json().catch(() => ({}));
    const cover = typeof body.cover === "string" ? body.cover.trim() : "";
    const title = parseI18n(body.title);
    const excerpt = parseI18n(body.excerpt);
    const content = parseI18n(body.content);
    const sortOrder = typeof body.sortOrder === "number" ? body.sortOrder : 0;

    if (!cover || !title || !excerpt || !content) {
      return apiError(400, "BAD_REQUEST", "cover, title, excerpt, content (each with en,ko,ja,zh) are required");
    }

    const post = await createBoardPost({ cover, title, excerpt, content, sortOrder });
    return apiOk(post);
  } catch (err) {
    console.error("[api/admin/board] POST failed", err);
    return apiError(500, "INTERNAL_ERROR", "Failed to create board post");
  }
}
