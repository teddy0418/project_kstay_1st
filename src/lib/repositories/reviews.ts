import { randomBytes } from "crypto";
import { prisma } from "@/lib/db";
import { translateText, type TargetLang } from "@/lib/translation";

const CATEGORY_KEYS = ["cleanliness", "accuracy", "checkIn", "communication", "location", "value"] as const;

function generateId(): string {
  return "c" + randomBytes(12).toString("hex");
}

export async function createReview(params: {
  bookingId: string;
  userId: string;
  listingId: string;
  body: string;
  cleanliness: number;
  accuracy: number;
  checkIn: number;
  communication: number;
  location: number;
  value: number;
}) {
  const nums = CATEGORY_KEYS.map((k) => Math.min(5, Math.max(1, params[k])));
  const rating = Math.round(nums.reduce((a, b) => a + b, 0) / nums.length);
  const body = params.body.trim().slice(0, 2000);
  const id = generateId();

  // Raw insert: 생성된 Prisma Client가 카테고리 필드를 모를 수 있어 DB에 직접 삽입
  await prisma.$executeRaw`
    INSERT INTO "Review" (id, "bookingId", "userId", "listingId", rating, body, cleanliness, accuracy, "checkIn", communication, location, value, "createdAt")
    VALUES (${id}, ${params.bookingId}, ${params.userId}, ${params.listingId}, ${rating}, ${body}, ${params.cleanliness}, ${params.accuracy}, ${params.checkIn}, ${params.communication}, ${params.location}, ${params.value}, now())
  `;

  const listing = await prisma.listing.findUnique({
    where: { id: params.listingId },
    select: { id: true, title: true, titleKo: true },
  });

  // 번역 캐시: 백그라운드로 en/ko/ja/zh 번역 후 DB 업데이트 (API 키 있을 때만)
  if (body.length >= 10) {
    fillReviewBodyI18n(id, body).catch((e) => console.error("[createReview] fillReviewBodyI18n", e));
  }

  return {
    id,
    bookingId: params.bookingId,
    userId: params.userId,
    listingId: params.listingId,
    rating,
    body,
    cleanliness: params.cleanliness,
    accuracy: params.accuracy,
    checkIn: params.checkIn,
    communication: params.communication,
    location: params.location,
    value: params.value,
    createdAt: new Date(),
    listing: listing ?? undefined,
  };
}

/** 리뷰 본문을 en/ko/ja/zh로 번역해 DB에 캐시. API 키 없으면 스킵 */
export async function fillReviewBodyI18n(reviewId: string, body: string): Promise<void> {
  const targets: TargetLang[] = ["en", "ko", "ja", "zh"];
  const updates: Record<string, string> = {};
  for (const lang of targets) {
    const translated = await translateText(body, lang);
    if (translated && translated !== body) {
      if (lang === "en") updates.bodyEn = translated;
      else if (lang === "ko") updates.bodyKo = translated;
      else if (lang === "ja") updates.bodyJa = translated;
      else if (lang === "zh") updates.bodyZh = translated;
    }
  }
  if (Object.keys(updates).length === 0) return;
  await prisma.review.update({
    where: { id: reviewId },
    data: updates as { bodyEn?: string; bodyKo?: string; bodyJa?: string; bodyZh?: string },
  });
}

export async function findReviewByBookingId(bookingId: string) {
  return prisma.review.findUnique({
    where: { bookingId },
  });
}

export async function findReviewsByListingId(listingId: string, limit = 50) {
  return prisma.review.findMany({
    where: { listingId },
    orderBy: { createdAt: "desc" },
    take: limit,
    include: {
      user: { select: { id: true, name: true, image: true, displayName: true, profilePhotoUrl: true } },
    },
  });
}

export async function findReviewsByUserId(userId: string, limit = 50) {
  return prisma.review.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: limit,
    include: {
      listing: { select: { id: true, title: true, titleKo: true } },
    },
  });
}
