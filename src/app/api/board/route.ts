import { apiError, apiOk } from "@/lib/api/response";
import { getBoardPosts } from "@/lib/repositories/board";

/** GET: 게스트 게시판 글 목록 (공개) */
export async function GET() {
  try {
    const posts = await getBoardPosts();
    return apiOk(posts);
  } catch (err) {
    console.error("[api/board] GET failed", err);
    return apiError(500, "INTERNAL_ERROR", "Failed to fetch board posts");
  }
}
