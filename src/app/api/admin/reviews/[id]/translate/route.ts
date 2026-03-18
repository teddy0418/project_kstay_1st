import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { apiError, apiOk } from "@/lib/api/response";
import { requireAdmin } from "@/lib/api/auth-guard";
import { fillReviewBodyI18n } from "@/lib/repositories/reviews";

/**
 * POST /api/admin/reviews/[id]/translate
 * 관리자 전용: 해당 리뷰 본문을 en/ko/ja/zh로 번역해 DB에 캐시합니다.
 * GOOGLE_TRANSLATE_API_KEY가 있으면 번역 후 bodyEn/bodyKo/bodyJa/bodyZh를 채웁니다.
 */
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAdmin();
    if (!auth.ok) return auth.response;
    const admin = auth.user;

    const { id } = await params;
    const review = await prisma.review.findUnique({
      where: { id },
      select: { id: true, body: true },
    });
    if (!review) return apiError(404, "NOT_FOUND", "Review not found");

    await fillReviewBodyI18n(review.id, review.body);

    const updated = await prisma.review.findUnique({
      where: { id },
      select: { id: true, bodyEn: true, bodyKo: true, bodyJa: true, bodyZh: true },
    });

    return apiOk({
      id: updated?.id,
      bodyEn: !!updated?.bodyEn,
      bodyKo: !!updated?.bodyKo,
      bodyJa: !!updated?.bodyJa,
      bodyZh: !!updated?.bodyZh,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[api/admin/reviews/[id]/translate] POST failed", err);
    return apiError(500, "INTERNAL_ERROR", message);
  }
}
