import { apiError, apiOk } from "@/lib/api/response";
import { getBoardPostById } from "@/lib/repositories/board";

/** GET: 게스트 게시판 글 단일 (공개) */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const post = await getBoardPostById(id);
    if (!post) return apiError(404, "NOT_FOUND", "Board post not found");
    return apiOk(post);
  } catch (err) {
    console.error("[api/board/[id]] GET failed", err);
    return apiError(500, "INTERNAL_ERROR", "Failed to fetch board post");
  }
}
