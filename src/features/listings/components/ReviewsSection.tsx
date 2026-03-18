import { Star, Sparkles, CheckCircle2, Key, MessageCircle, MapPin, Tag } from "lucide-react";
import { formatDate, formatNumber } from "@/lib/format";

export type DbReview = {
  id: string;
  userId?: string;
  userName: string;
  userImage?: string | null;
  rating: number;
  body: string;
  bodyEn?: string | null;
  bodyKo?: string | null;
  bodyJa?: string | null;
  bodyZh?: string | null;
  createdAt: string;
  cleanliness?: number | null;
  accuracy?: number | null;
  checkIn?: number | null;
  communication?: number | null;
  location?: number | null;
  value?: number | null;
};

function getReviewBodyForLang(r: DbReview, lang: "en" | "ko" | "ja" | "zh"): string {
  const byLang = lang === "ko" ? r.bodyKo : lang === "ja" ? r.bodyJa : lang === "zh" ? r.bodyZh : r.bodyEn;
  return (byLang?.trim() || r.body) ?? "";
}

function avatarLetterFromId(id: string): string {
  let n = 0;
  for (let i = 0; i < id.length; i++) n = (n * 31 + id.charCodeAt(i)) >>> 0;
  return "ABCDEFGHIJKLMNOPQRSTUVWXYZ"[n % 26];
}

const REVIEW_COPY = {
  ko: {
    reviews: "리뷰",
    overall: "전체 평점",
    newBadge: "신규",
    noReviews: "아직 리뷰가 없습니다",
    cats: { cleanliness: "청결도", accuracy: "정확성", checkIn: "체크인", communication: "소통", location: "위치", value: "가성비" },
  },
  ja: {
    reviews: "件のレビュー",
    overall: "総合評価",
    newBadge: "新着",
    noReviews: "まだレビューがありません",
    cats: { cleanliness: "清潔さ", accuracy: "掲載内容の正確さ", checkIn: "チェックイン", communication: "コミュニケーション", location: "ロケーション", value: "コストパフォーマンス" },
  },
  zh: {
    reviews: "条评价",
    overall: "综合评分",
    newBadge: "新上架",
    noReviews: "还没有评价",
    cats: { cleanliness: "清洁度", accuracy: "信息准确度", checkIn: "入住体验", communication: "沟通", location: "位置", value: "性价比" },
  },
  en: {
    reviews: "reviews",
    overall: "Overall rating",
    newBadge: "New",
    noReviews: "No reviews yet",
    cats: { cleanliness: "Cleanliness", accuracy: "Accuracy", checkIn: "Check-in", communication: "Communication", location: "Location", value: "Value" },
  },
} as const;

type ReviewCategoryWithAvg = { cleanliness: number; accuracy: number; checkIn: number; communication: number; location: number; value: number };

export default function ReviewsSection({
  rating,
  count,
  lang,
  locale,
  dbReviews,
}: {
  rating: number;
  count: number;
  lang: "en" | "ko" | "ja" | "zh";
  locale: string;
  dbReviews?: DbReview[];
}) {
  const t = REVIEW_COPY[lang];

  const reviewsWithCategories = (dbReviews ?? []).filter(
    (r): r is DbReview & ReviewCategoryWithAvg =>
      r.cleanliness != null && r.accuracy != null && r.checkIn != null &&
      r.communication != null && r.location != null && r.value != null
  );

  const categoryKeys = ["cleanliness", "accuracy", "checkIn", "communication", "location", "value"] as const;
  const categoryAverages = categoryKeys.map((key) => {
    if (reviewsWithCategories.length === 0) return null;
    const sum = reviewsWithCategories.reduce((a, r) => a + r[key], 0);
    return Math.round((sum / reviewsWithCategories.length) * 10) / 10;
  });

  const hasReviews = dbReviews != null && dbReviews.length > 0;

  const dist = (() => {
    if (!hasReviews) return null;
    const counts = [0, 0, 0, 0, 0];
    dbReviews.forEach((r) => {
      const idx = Math.min(5, Math.max(1, r.rating)) - 1;
      counts[idx]++;
    });
    const total = counts.reduce((a, b) => a + b, 0);
    return counts.map((c, i) => ({ stars: i + 1, pct: total > 0 ? Math.round((c / total) * 100) : 0 }));
  })();

  const displayRating = hasReviews
    ? dbReviews.reduce((a, r) => a + r.rating, 0) / dbReviews.length
    : rating;

  const cats = hasReviews
    ? [
        { label: t.cats.cleanliness, icon: Sparkles, value: categoryAverages[0] },
        { label: t.cats.accuracy, icon: CheckCircle2, value: categoryAverages[1] },
        { label: t.cats.checkIn, icon: Key, value: categoryAverages[2] },
        { label: t.cats.communication, icon: MessageCircle, value: categoryAverages[3] },
        { label: t.cats.location, icon: MapPin, value: categoryAverages[4] },
        { label: t.cats.value, icon: Tag, value: categoryAverages[5] },
      ].filter((c): c is typeof c & { value: number } => c.value != null)
    : [];

  const reviews = hasReviews
    ? [...dbReviews]
        .sort((a, b) => {
          if (b.rating !== a.rating) return b.rating - a.rating;
          return (b.body?.length ?? 0) - (a.body?.length ?? 0);
        })
        .map((r) => {
          const name = r.userName ?? "Guest";
          const letter = name.trim().slice(0, 1).toUpperCase() || avatarLetterFromId(r.userId ?? r.id);
          return { id: r.id, name, letter, meta: "", date: formatDate(locale, r.createdAt, { year: "numeric", month: "short", day: "numeric" }), stars: r.rating, body: getReviewBodyForLang(r, lang) };
        })
    : [];

  return (
    <section id="reviews" className="mt-12">
      <div className="flex items-center gap-2 text-lg font-semibold">
        <Star className="h-5 w-5" />
        {hasReviews ? (
          <>
            <span>{displayRating.toFixed(2)}</span>
            <span className="text-neutral-400">·</span>
            <span>{formatNumber(locale, count)} {t.reviews}</span>
          </>
        ) : (
          <span>{t.newBadge}</span>
        )}
      </div>

      {!hasReviews ? (
        <div className="mt-6 rounded-2xl border border-neutral-200 bg-neutral-50 px-6 py-8 text-center text-sm text-neutral-500">
          {t.noReviews}
        </div>
      ) : (
        <>
          <div className="mt-6 grid gap-6 lg:grid-cols-[200px_minmax(0,1fr)]">
            {dist && (
              <div className="rounded-2xl border border-neutral-200 p-4">
                <div className="text-sm font-semibold">{t.overall}</div>
                <div className="mt-4 grid gap-2">
                  {dist.map((d) => (
                    <div key={d.stars} className="flex items-center gap-3 text-sm">
                      <div className="w-4 text-xs text-neutral-500">{d.stars}</div>
                      <div className="flex-1 h-2 rounded-full bg-neutral-200 overflow-hidden">
                        <div className="h-full bg-neutral-900" style={{ width: `${d.pct}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {cats.length > 0 && (
              <>
                <div className="md:hidden rounded-2xl border border-neutral-200 p-4">
                  <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                    {cats.map((c) => {
                      const Icon = c.icon;
                      return (
                        <div key={c.label} className="flex items-center justify-between gap-2 min-w-0">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <Icon className="h-3.5 w-3.5 shrink-0 text-neutral-500" />
                            <span className="text-xs font-medium text-neutral-700 truncate">{c.label}</span>
                          </div>
                          <span className="text-sm font-semibold tabular-nums shrink-0">{c.value.toFixed(1)}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
                <div className="hidden md:grid min-w-0 grid-cols-2 gap-4 xl:grid-cols-3">
                  {cats.map((c) => {
                    const Icon = c.icon;
                    return (
                      <div key={c.label} className="rounded-2xl border border-neutral-200 p-5">
                        <div className="flex items-center gap-2 text-sm font-semibold text-neutral-700 min-w-0">
                          <Icon className="h-4 w-4 shrink-0" />
                          <span className="min-w-0 truncate">{c.label}</span>
                        </div>
                        <div className="mt-2 text-xl font-semibold">{c.value.toFixed(1)}</div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>

          <div className="mt-8 grid gap-6 md:grid-cols-2">
            {reviews.map((r) => (
              <div key={r.id} className="rounded-2xl border border-neutral-200 p-5">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-neutral-900 text-sm font-semibold text-white">
                    {r.letter ?? r.name.slice(0, 1)}
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-semibold">{r.name}</div>
                    {r.meta && <div className="text-xs text-neutral-500">{r.meta}</div>}
                    <div className="mt-2 text-xs text-neutral-500">
                      {"★".repeat(r.stars)} <span className="mx-2">·</span> {r.date}
                    </div>
                    <p className="mt-2 text-sm text-neutral-700 leading-7">{r.body}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </section>
  );
}
