import Container from "@/components/layout/Container";
import { getPublicListingById, getPublicListings } from "@/lib/repositories/listings";
import { findReviewsByListingId } from "@/lib/repositories/reviews";
import ListingGallery from "@/features/listings/components/ListingGallery";
import DetailActions from "@/features/listings/components/DetailActions";
import MapModal from "@/features/listings/components/MapModal";
import BookingWidget from "@/features/listings/components/BookingWidget";
import { getServerLang } from "@/lib/i18n/server";
import { formatDateEn, addDays, parseISODate } from "@/lib/format";
import Link from "next/link";
import Image from "next/image";
import { ChevronRight, MapPin, Star, Sparkles, CheckCircle2, Key, MessageCircle, Tag, ShieldCheck } from "lucide-react";
import AmenitiesList from "@/features/listings/components/AmenitiesList";

function normalizeId(v: unknown) {
  if (v == null) return "";
  return String(v);
}

function freeCancelUntilKST(checkInISO?: string) {
  if (!checkInISO) return null;
  const checkIn = parseISODate(checkInISO);
  const deadline = addDays(checkIn, -5);
  return `${formatDateEn(deadline)} 23:59 (KST)`;
}

function localizeHostBio(
  listing: { id: string; hostBio: string; hostBioI18n?: { ko?: string; ja?: string; zh?: string } },
  fallbackBio: string,
  lang: "en" | "ko" | "ja" | "zh"
) {
  if (lang === "ko" && listing.hostBioI18n?.ko) return listing.hostBioI18n.ko;
  if (lang === "ja" && listing.hostBioI18n?.ja) return listing.hostBioI18n.ja;
  if (lang === "zh" && listing.hostBioI18n?.zh) return listing.hostBioI18n.zh;

  const table: Record<string, Record<"en" | "ko" | "ja" | "zh", string>> = {
    "seoul-seongsu-studio": {
      en: "Local host in Seoul. Clear English check-in guide and simple house rules.",
      ko: "서울 로컬 호스트입니다. 명확한 체크인 가이드와 간단한 하우스 룰을 제공합니다.",
      ja: "ソウル在住ホストです。分かりやすいチェックイン案内とシンプルなハウスルールをご用意しています。",
      zh: "首尔本地房东，提供清晰的入住指引和简洁的房屋规则。",
    },
    "seoul-bukchon-hanok": {
      en: "Peaceful hanok stay with detailed instructions for international guests.",
      ko: "해외 게스트도 쉽게 이용할 수 있도록 상세 안내를 제공하는 조용한 한옥 숙소입니다.",
      ja: "海外ゲスト向けの詳細案内がある、静かな韓屋ステイです。",
      zh: "安静的韩屋住宿，并为国际旅客提供详细入住说明。",
    },
    "busan-haeundae-ocean": {
      en: "Busan local host. Quick replies and easy check-in.",
      ko: "부산 로컬 호스트로 빠른 응답과 쉬운 체크인을 제공합니다.",
      ja: "釜山ローカルホスト。返信が早く、チェックインも簡単です。",
      zh: "釜山本地房东，回复及时，入住流程简单。",
    },
    "jeju-aewol-stonehouse": {
      en: "Jeju host. Slow, peaceful vibes and clear English guidance.",
      ko: "제주의 느리고 평화로운 분위기를 담은 숙소로, 명확한 영어 안내를 제공합니다.",
      ja: "済州のゆったりした空気を感じられる宿で、英語案内も分かりやすいです。",
      zh: "济州风格的慢节奏宁静住宿，并提供清晰的英文引导。",
    },
    "incheon-airport-stay": {
      en: "Airport-friendly host. Great for late arrivals with quick check-in.",
      ko: "공항 접근이 좋아 늦은 도착에도 빠르게 체크인할 수 있는 숙소입니다.",
      ja: "空港アクセスに優れ、深夜到着でもスムーズにチェックインできます。",
      zh: "靠近机场，适合晚到旅客，可快速办理入住。",
    },
  };

  return table[listing.id]?.[lang] ?? fallbackBio;
}

type DbReview = {
  id: string;
  userId?: string;
  userName: string;
  userImage?: string | null;
  rating: number;
  body: string;
  createdAt: string;
  cleanliness?: number | null;
  accuracy?: number | null;
  checkIn?: number | null;
  communication?: number | null;
  location?: number | null;
  value?: number | null;
};

function avatarLetterFromId(id: string): string {
  let n = 0;
  for (let i = 0; i < id.length; i++) n = (n * 31 + id.charCodeAt(i)) >>> 0;
  return "ABCDEFGHIJKLMNOPQRSTUVWXYZ"[n % 26];
}
function ReviewsSection({
  rating,
  count,
  lang,
  dbReviews,
}: {
  rating: number;
  count: number;
  lang: "en" | "ko" | "ja" | "zh";
  dbReviews?: DbReview[];
}) {
  const t =
    lang === "ko"
      ? {
          reviews: "리뷰",
          overall: "전체 평점",
          cats: {
            cleanliness: "청결도",
            accuracy: "정확성",
            checkIn: "체크인",
            communication: "소통",
            location: "위치",
            value: "가성비",
          },
          reviewsData: [
            {
              id: "r1",
              name: "Chaewon",
              meta: "5년차 회원",
              date: "2주 전",
              stars: 5,
              body: "매우 깔끔하고 편안한 숙소였어요. 뷰도 좋고 시설도 만족스러웠습니다. 다음에 한국 방문하면 다시 예약하고 싶어요.",
            },
            {
              id: "r2",
              name: "Jungwoo",
              meta: "7년차 회원",
              date: "2025년 12월",
              stars: 5,
              body: "위치가 정말 좋고 사진과 실제가 거의 같았어요. 주변 편의시설도 많고 체크인도 매우 매끄러웠습니다.",
            },
            {
              id: "r3",
              name: "Hyejin",
              meta: "8년차 회원",
              date: "2025년 9월",
              stars: 5,
              body: "가격 대비 만족도가 높았습니다. 침구가 편안하고 객실도 매우 깨끗했어요. 호스트 응답도 빨랐습니다.",
            },
            {
              id: "r4",
              name: "Jiyoung",
              meta: "8년차 회원",
              date: "2025년 9월",
              stars: 5,
              body: "설명 그대로였고 전체 경험이 좋았습니다. 동네가 안전하고 교통 접근성도 좋아서 편리했어요.",
            },
          ],
        }
      : lang === "ja"
        ? {
            reviews: "件のレビュー",
            overall: "総合評価",
            cats: {
              cleanliness: "清潔さ",
              accuracy: "掲載内容の正確さ",
              checkIn: "チェックイン",
              communication: "コミュニケーション",
              location: "ロケーション",
              value: "コストパフォーマンス",
            },
            reviewsData: [
              {
                id: "r1",
                name: "Chaewon",
                meta: "メンバー歴 5年",
                date: "2週間前",
                stars: 5,
                body: "とても清潔で快適な滞在でした。景色も良く設備も充実していて、また韓国に来るときに利用したいです。",
              },
              {
                id: "r2",
                name: "Jungwoo",
                meta: "メンバー歴 7年",
                date: "2025年12月",
                stars: 5,
                body: "立地が素晴らしく、写真どおりのお部屋でした。周辺施設も便利でチェックインもスムーズでした。",
              },
              {
                id: "r3",
                name: "Hyejin",
                meta: "メンバー歴 8年",
                date: "2025年9月",
                stars: 5,
                body: "価格以上の価値がありました。ベッドも快適で部屋も清潔、ホストの対応も迅速でした。",
              },
              {
                id: "r4",
                name: "Jiyoung",
                meta: "メンバー歴 8年",
                date: "2025年9月",
                stars: 5,
                body: "説明どおりで全体的に満足です。周辺も安全で交通アクセスも良く、移動がしやすかったです。",
              },
            ],
          }
        : lang === "zh"
          ? {
              reviews: "条评价",
              overall: "综合评分",
              cats: {
                cleanliness: "清洁度",
                accuracy: "信息准确度",
                checkIn: "入住体验",
                communication: "沟通",
                location: "位置",
                value: "性价比",
              },
              reviewsData: [
                {
                  id: "r1",
                  name: "Chaewon",
                  meta: "会员 5 年",
                  date: "2 周前",
                  stars: 5,
                  body: "房间非常干净舒适，景观也很好，设施齐全。下次来韩国还会再次预订。",
                },
                {
                  id: "r2",
                  name: "Jungwoo",
                  meta: "会员 7 年",
                  date: "2025年12月",
                  stars: 5,
                  body: "地理位置很棒，房间和图片一致。周边配套方便，入住流程也很顺畅。",
                },
                {
                  id: "r3",
                  name: "Hyejin",
                  meta: "会员 8 年",
                  date: "2025年9月",
                  stars: 5,
                  body: "性价比很高，床很舒服，房间非常整洁。房东回复及时，整体体验很好。",
                },
                {
                  id: "r4",
                  name: "Jiyoung",
                  meta: "会员 8 年",
                  date: "2025年9月",
                  stars: 5,
                  body: "与描述一致，整体体验非常好。社区安全，交通便利，出行很方便。",
                },
              ],
            }
          : {
              reviews: "reviews",
              overall: "Overall rating",
              cats: {
                cleanliness: "Cleanliness",
                accuracy: "Accuracy",
                checkIn: "Check-in",
                communication: "Communication",
                location: "Location",
                value: "Value",
              },
              reviewsData: [
                {
                  id: "r1",
                  name: "Chaewon",
                  meta: "Member for 5 years",
                  date: "2 weeks ago",
                  stars: 5,
                  body:
                    "Very clean and comfortable stay. Great view and the facilities were excellent. Would definitely book again next time I visit Korea.",
                },
                {
                  id: "r2",
                  name: "Jungwoo",
                  meta: "Member for 7 years",
                  date: "Dec 2025",
                  stars: 5,
                  body:
                    "The location was perfect and the room looked exactly like the photos. Lots of convenient amenities nearby. Smooth check-in process!",
                },
                {
                  id: "r3",
                  name: "Hyejin",
                  meta: "Member for 8 years",
                  date: "Sep 2025",
                  stars: 5,
                  body:
                    "Great value for money. The bed was comfy and the room was spotless. The host was responsive and helpful throughout the stay.",
                },
                {
                  id: "r4",
                  name: "Jiyoung",
                  meta: "Member for 8 years",
                  date: "Sep 2025",
                  stars: 5,
                  body:
                    "Everything was as described and the overall experience was amazing. The neighborhood felt safe and the transportation options were easy.",
                },
              ],
            };
  const reviewsWithCategories = (dbReviews ?? []).filter(
    (r): r is DbReview & { cleanliness: number; accuracy: number; checkIn: number; communication: number; location: number; value: number } =>
      r.cleanliness != null &&
      r.accuracy != null &&
      r.checkIn != null &&
      r.communication != null &&
      r.location != null &&
      r.value != null
  );

  const categoryKeys = ["cleanliness", "accuracy", "checkIn", "communication", "location", "value"] as const;
  const categoryAverages = categoryKeys.map((key) => {
    if (reviewsWithCategories.length === 0) return null;
    const sum = reviewsWithCategories.reduce((a, r) => a + r[key], 0);
    return Math.round((sum / reviewsWithCategories.length) * 10) / 10;
  });

  const dist = (() => {
    if (!dbReviews?.length) {
      return [
        { stars: 5, pct: 72 },
        { stars: 4, pct: 18 },
        { stars: 3, pct: 7 },
        { stars: 2, pct: 2 },
        { stars: 1, pct: 1 },
      ];
    }
    const counts = [0, 0, 0, 0, 0];
    dbReviews.forEach((r) => {
      const idx = Math.min(5, Math.max(1, r.rating)) - 1;
      counts[idx]++;
    });
    const total = counts.reduce((a, b) => a + b, 0);
    return counts.map((c, i) => ({ stars: i + 1, pct: total > 0 ? Math.round((c / total) * 100) : 0 }));
  })();

  const displayRating = dbReviews?.length
    ? dbReviews.reduce((a, r) => a + r.rating, 0) / dbReviews.length
    : rating;
  const cats = [
    { label: t.cats.cleanliness, icon: Sparkles, value: categoryAverages[0] ?? 4.9 },
    { label: t.cats.accuracy, icon: CheckCircle2, value: categoryAverages[1] ?? 4.9 },
    { label: t.cats.checkIn, icon: Key, value: categoryAverages[2] ?? 4.8 },
    { label: t.cats.communication, icon: MessageCircle, value: categoryAverages[3] ?? 4.9 },
    { label: t.cats.location, icon: MapPin, value: categoryAverages[4] ?? 4.8 },
    { label: t.cats.value, icon: Tag, value: categoryAverages[5] ?? 4.9 },
  ];
  const reviews =
    dbReviews && dbReviews.length > 0
      ? dbReviews.map((r) => {
          const image = r.userImage ?? null;
          const noPhoto = !image;
          const name = r.userName ?? "Guest";
          const letter = noPhoto
            ? (name.trim().slice(0, 1).toUpperCase() || avatarLetterFromId(r.userId ?? r.id))
            : null;
          return {
            id: r.id,
            name,
            image,
            letter,
            meta: "",
            date: new Date(r.createdAt).toLocaleDateString(lang === "ko" ? "ko-KR" : lang === "ja" ? "ja-JP" : "en-US", {
              year: "numeric",
              month: "short",
              day: "numeric",
            }),
            stars: r.rating,
            body: r.body,
          };
        })
      : t.reviewsData.map((r) => ({ ...r, image: null as string | null, letter: r.name.slice(0, 1) }));

  return (
    <section id="reviews" className="mt-12">
      <div className="flex items-center gap-2 text-lg font-semibold">
        <Star className="h-5 w-5" />
        <span>{displayRating.toFixed(2)}</span>
        <span className="text-neutral-400">·</span>
        <span>{count.toLocaleString()} {t.reviews}</span>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[200px_minmax(0,1fr)]">
        {/* distribution: 좁게 해서 오른쪽 카테고리 그리드에 공간 확보 */}
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

        {/* 모바일: 한 카드 안에 6개 항목 컴팩트 배치 / 데스크톱: 기존 6개 카드 */}
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
      </div>

      {/* list */}
      <div className="mt-8 grid gap-6 md:grid-cols-2">
        {reviews.map((r) => (
          <div key={r.id} className="rounded-2xl border border-neutral-200 p-5">
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 shrink-0 rounded-full bg-neutral-900 text-white grid place-items-center text-sm font-semibold overflow-hidden">
                {r.image ? (
                  <Image src={r.image} alt="" width={40} height={40} className="h-full w-full object-cover" unoptimized />
                ) : (
                  (r as { letter?: string }).letter ?? r.name.slice(0, 1)
                )}
              </div>
              <div className="min-w-0">
                <div className="text-sm font-semibold">{r.name}</div>
                <div className="text-xs text-neutral-500">{r.meta}</div>

                <div className="mt-2 text-xs text-neutral-500">
                  {"★".repeat(r.stars)} <span className="mx-2">·</span> {r.date}
                </div>
                <p className="mt-2 text-sm text-neutral-700 leading-7">{r.body}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export default async function ListingDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const lang = await getServerLang();
  const tx =
    lang === "ko"
      ? {
          notFound: "숙소를 찾을 수 없습니다",
          availableIds: "사용 가능한 숙소 ID",
          home: "홈",
          reviews: "리뷰",
          reviewsDesc: "가성비가 좋고, 청결도와 위치 만족도가 높습니다.",
          viewReviews: "리뷰 보기 →",
          amenities: "어메니티",
          location: "위치",
          mapPreview: "지도 미리보기",
          hostedBy: "호스트",
          verifiedPartner: "정부 인증 숙소 파트너",
          about: "숙소 소개",
          noSurprise: "안내: KSTAY는 최종 결제금액을 먼저 표시해 결제 단계의 추가 요금을 줄입니다.",
          cancellationPolicy: "취소 규정",
          policyTitle: "KSTAY 안심 환불 정책",
          policy24h: "24시간 프리 패스: 예약 후 24시간 내 취소 시 무조건 100% 환불 (체크인 48시간 전 예약에 한함)",
          policyGeneral: "일반 예약: 체크인 5일 전까지 취소 시 100% 환불",
          policyLate: "임박 취소: 체크인 5일 전부터는 환불 불가 (노쇼 포함)",
          policySpecial: "특가 예약: '환불 불가' 상품은 24시간 경과 후 취소 시 전액 환불 불가",
          policyFee: "결제 수단에 따라 소정의 취소 수수료가 부과될 수 있습니다.",
          kstAndLocal: "모든 마감 시각은 KST(서울) 기준입니다. 예약 시 당신의 현지 시간으로도 안내됩니다.",
          freeUntilPrefix: "무료 취소 가능 기한:",
          freeUntilDefault: "체크인 5일 전(23:59 KST)까지 무료 취소 가능합니다.",
          noRefund: "무료 취소 기한 이후 취소는 환불 불가입니다.",
          instantPay:
            "즉시 결제 모델: 예약은 바로 생성되지만 호스트가 24시간 내 거절할 수 있습니다. 거절 시 결제는 자동 취소/환불됩니다.",
          kstBase: "모든 정책 시간 기준은 한국 표준시(KST)입니다.",
              govCertified: "정부인증숙소",
        }
      : lang === "ja"
        ? {
            notFound: "宿泊先が見つかりません",
            availableIds: "利用可能な宿泊先ID",
            home: "ホーム",
            reviews: "レビュー",
            reviewsDesc: "高コスパで、清潔さと立地の評価が高い宿です。",
            viewReviews: "レビューを見る →",
            amenities: "アメニティ",
            location: "ロケーション",
            mapPreview: "地図プレビュー",
            hostedBy: "ホスト",
            verifiedPartner: "政府認証宿泊施設パートナー",
            about: "この宿泊先について",
            noSurprise: "注記: KSTAYは総額を先に表示し、チェックアウト時の追加料金を抑えます。",
            cancellationPolicy: "キャンセル規定",
            policyTitle: "KSTAY安心返金ポリシー",
            policy24h: "24時間フリーパス: 予約後24時間以内のキャンセルは100%返金（チェックイン48時間前までの予約に限る）",
            policyGeneral: "一般予約: チェックイン5日前までキャンセルで100%返金",
            policyLate: "直前キャンセル: チェックイン5日前からは返金不可（ノーショー含む）",
            policySpecial: "特割予約: 「返金不可」商品は24時間経過後のキャンセルで全額返金不可",
            policyFee: "お支払い方法によりキャンセル手数料がかかる場合があります。",
            kstAndLocal: "すべての期限はKST(ソウル)基準です。予約時に現地時間でも案内します。",
            freeUntilPrefix: "無料キャンセル期限:",
            freeUntilDefault: "チェックイン5日前（23:59 KST）まで無料キャンセル可能です。",
            noRefund: "無料キャンセル期限後のキャンセルは返金不可です。",
            instantPay:
              "即時決済モデル: 予約はすぐ作成されますが、ホストは24時間以内に拒否できます。拒否された場合、決済は自動取消/返金されます。",
            kstBase: "すべてのポリシー時刻は韓国標準時(KST)基準です。",
              govCertified: "政府認証宿泊施設",
          }
        : lang === "zh"
          ? {
              notFound: "未找到房源",
              availableIds: "可用房源 ID",
              home: "首页",
              reviews: "评价",
              reviewsDesc: "高性价比住宿，住客对清洁度和位置评价很高。",
              viewReviews: "查看评价 →",
              amenities: "设施",
              location: "位置",
              mapPreview: "地图预览",
              hostedBy: "房东",
              verifiedPartner: "政府认证住宿伙伴",
              about: "房源介绍",
              noSurprise: "说明: KSTAY 会提前展示总价，减少结算阶段的额外费用。",
              cancellationPolicy: "取消规定",
              policyTitle: "KSTAY 安心退款政策",
              policy24h: "24小时免费取消：预订后24小时内取消可100%退款（仅限入住48小时前的预订）",
              policyGeneral: "一般预订：入住前5天取消可100%退款",
              policyLate: "临近取消：入住前5天起不可退款（含未入住）",
              policySpecial: "特价预订：「不可退款」产品在24小时后取消将不退款",
              policyFee: "根据支付方式可能产生少量取消手续费。",
              kstAndLocal: "所有截止时间以KST(首尔)为准。预订时会同时显示您当地时间。",
              freeUntilPrefix: "免费取消截止:",
              freeUntilDefault: "入住前 5 天（23:59 KST）可免费取消。",
              noRefund: "免费取消截止后取消将不予退款。",
              instantPay:
                "即时支付模式：预订会立即创建，但房东可在24小时内拒绝。若被拒绝，将自动撤销/退款。",
              kstBase: "所有政策时间均以韩国标准时间(KST)为准。",
              govCertified: "政府认证住宿",
            }
          : {
              notFound: "Listing not found",
              availableIds: "Available listing IDs",
              home: "Home",
              reviews: "reviews",
              reviewsDesc: "Best value stay. Guests love the clean rooms and convenient location.",
              viewReviews: "View reviews →",
              amenities: "Amenities",
              location: "Location",
              mapPreview: "Map preview",
              hostedBy: "Hosted by",
              verifiedPartner: "Government-certified accommodation partner",
              about: "About this stay",
              noSurprise: "Note: KSTAY shows all-in price early. No surprise fees at checkout.",
              cancellationPolicy: "Cancellation policy",
              policyTitle: "KSTAY refund policy",
              policy24h: "24-hour free pass: Cancel within 24 hours of booking for 100% refund (only for bookings made 48+ hours before check-in).",
              policyGeneral: "Standard: 100% refund if you cancel by 5 days before check-in.",
              policyLate: "Late cancellation: From 5 days before check-in, no refund (including no-show).",
              policySpecial: "Non-refundable rate: No refund after 24 hours from booking.",
              policyFee: "Your payment method may charge a small cancellation fee.",
              kstAndLocal: "All deadlines are in KST (Seoul). We also show your local time at checkout.",
              freeUntilPrefix: "Free cancellation until",
              freeUntilDefault: "Free cancellation until 5 days before check-in (23:59 KST).",
              noRefund: "After the free cancellation deadline, cancellations are not refundable.",
              instantPay:
                "Instant pay model: your booking is confirmed immediately, but the host may decline within 24 hours. If declined, payment will be voided/refunded automatically.",
              kstBase: "All policy times are based on Korea Standard Time (KST).",
              govCertified: "Government-Certified",
            };
  const { id: rawParam } = await params;
  const raw = rawParam ?? "";
  const id = decodeURIComponent(raw);

  const listing = (await getPublicListingById(id)) ?? (await getPublicListingById(raw));

  if (!listing) {
    const all = await getPublicListings();
    const available = all.map((l: { id?: unknown }) => normalizeId(l.id)).filter(Boolean);

    return (
      <Container className="py-10">
        <h1 className="text-2xl font-semibold tracking-tight">{tx.notFound}</h1>
        <div className="mt-6 rounded-2xl border border-neutral-200 p-5">
          <div className="text-sm font-semibold">{tx.availableIds}</div>
          <div className="mt-3 grid gap-2">
            {available.map((x) => (
              <Link
                key={x}
                href={`/listings/${encodeURIComponent(x)}`}
                className="rounded-xl border border-neutral-200 px-4 py-3 text-sm font-semibold hover:bg-neutral-50 transition"
              >
                {x}
              </Link>
            ))}
          </div>
        </div>
      </Container>
    );
  }

  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const start = typeof resolvedSearchParams?.start === "string" ? resolvedSearchParams.start : undefined;
  const end = typeof resolvedSearchParams?.end === "string" ? resolvedSearchParams.end : undefined;
  const guests = typeof resolvedSearchParams?.guests === "string" ? Number(resolvedSearchParams.guests) : undefined;

  const dbReviews = await findReviewsByListingId(listing.id);
  const reviewCount =
    dbReviews.length > 0 ? dbReviews.length : Number((listing as { reviewCount?: number }).reviewCount ?? 0) || 0;
  const cancelUntil = freeCancelUntilKST(start);

  const mapSrc =
    listing.lat && listing.lng
      ? `https://www.google.com/maps?q=${encodeURIComponent(String(listing.lat))},${encodeURIComponent(
          String(listing.lng)
        )}&z=14&output=embed`
      : null;

  return (
    <Container className="py-8">
      {/* Breadcrumbs */}
      <nav className="text-xs md:text-sm text-neutral-500 flex flex-wrap items-center gap-2 min-w-0">
        <Link href="/" className="hover:underline">
          {tx.home}
        </Link>
        <ChevronRight className="h-4 w-4" />
        <span>{listing.location}</span>
        <ChevronRight className="h-4 w-4" />
        <span className="truncate">{listing.title}</span>
      </nav>

      {/* Title + actions */}
      <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-xl font-semibold tracking-tight md:text-2xl">{listing.title}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-neutral-600">
            <span className="inline-flex items-center gap-1 text-neutral-900">
              <Star className="h-4 w-4" />
              <span className="font-medium">{listing.rating.toFixed(2)}</span>
            </span>
            <span>·</span>
            <a href="#reviews" className="hover:underline">
              {reviewCount.toLocaleString()} {tx.reviews}
            </a>
            <span>·</span>
            <span className="inline-flex items-center gap-1">
              <MapPin className="h-4 w-4" />
              {listing.location}
            </span>
          </div>
        </div>

        <DetailActions listingId={String(listing.id)} />
      </div>

      {/* Gallery */}
      <div className="mt-6">
        <ListingGallery title={listing.title} images={listing.images} />
      </div>

      {/* 모바일/작은 화면: 숙소 사진 바로 아래 → 리뷰 카드 위에 예약칸 */}
      <div className="mt-6 lg:hidden">
        <BookingWidget
          listingId={String(listing.id)}
          basePricePerNightKRW={listing.pricePerNightKRW}
          nonRefundableSpecialEnabled={listing.nonRefundableSpecialEnabled}
          defaultStart={start}
          defaultEnd={end}
          defaultGuests={Number.isFinite(guests) ? guests : undefined}
        />
      </div>

      {/* ✅ 사진 아래 3카드 (리뷰/부대시설/위치) */}
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
        {/* Reviews card */}
        <a
          href="#reviews"
          className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm hover:shadow-md transition"
        >
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-full bg-neutral-900 px-3 py-1 text-xs font-semibold text-white">
              <Star className="h-4 w-4" />
              {listing.rating.toFixed(2)}
            </span>
            <div className="text-sm font-semibold">{reviewCount.toLocaleString()} {tx.reviews}</div>
          </div>
          <p className="mt-3 text-sm text-neutral-600 leading-6">
            {tx.reviewsDesc}
          </p>
          <div className="mt-4 text-sm font-semibold text-neutral-900">{tx.viewReviews}</div>
        </a>

        {/* Amenities card */}
        <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
          <div className="text-sm font-semibold">{tx.amenities}</div>
          <div className="mt-3">
            <AmenitiesList amenities={listing.amenities ?? []} lang={lang} />
          </div>
        </div>

        {/* Location card */}
        <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div className="text-sm font-semibold">{tx.location}</div>
            <MapModal address={listing.address} lat={listing.lat} lng={listing.lng} />
          </div>
          <div className="mt-2 text-sm text-neutral-700">{listing.address}</div>

          <div className="mt-3 overflow-hidden rounded-xl border border-neutral-200 bg-neutral-100">
            {mapSrc ? (
              <iframe
                title="map-preview"
                src={mapSrc}
                className="h-[88px] w-full"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            ) : (
              <div className="h-[88px] grid place-items-center text-xs text-neutral-500">{tx.mapPreview}</div>
            )}
          </div>
        </div>
      </div>

      {/* ✅ 2컬럼: 좌 설명 / 우 예약 위젯(sticky) */}
      <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_380px]">
        {/* Left */}
        <section className="min-w-0">
          {/* Host card */}
          <div className="flex flex-wrap items-center gap-4 rounded-2xl border border-neutral-200 p-5">
            <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full bg-neutral-100">
              <Image
                src={listing.hostProfileImageUrl}
                alt={listing.hostName}
                className="h-full w-full object-cover"
                fill
                sizes="48px"
              />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-semibold">{tx.hostedBy} {listing.hostName}</div>
              <div className="mt-1 text-xs text-neutral-500">{tx.verifiedPartner}</div>
            </div>
            <div className="flex shrink-0 items-center gap-1.5 rounded-full bg-neutral-900 px-3 py-1 text-xs font-semibold text-white w-full sm:w-auto">
              <ShieldCheck className="h-4 w-4 shrink-0 text-blue-400" aria-hidden />
              {tx.govCertified}
            </div>
          </div>

          {/* Description */}
          <div className="mt-6 rounded-2xl border border-neutral-200 p-5">
            <h2 className="text-lg font-semibold">{tx.about}</h2>
            <p className="mt-3 text-sm text-neutral-700 leading-7 whitespace-pre-line">
              {localizeHostBio(listing, listing.hostBio, lang)}
            </p>
            <div className="mt-4 text-xs text-neutral-500">
              {tx.noSurprise}
            </div>
          </div>

          {/* Reviews */}

          <ReviewsSection rating={listing.rating} count={reviewCount} lang={lang} dbReviews={dbReviews.map((r) => ({
            id: r.id,
            userId: r.user?.id,
            userName: (r.user?.displayName?.trim() || r.user?.name) ?? "Guest",
            userImage: r.user?.profilePhotoUrl?.trim() || null,
            rating: r.rating,
            body: r.body,
            createdAt: r.createdAt.toISOString(),
            cleanliness: r.cleanliness ?? undefined,
            accuracy: r.accuracy ?? undefined,
            checkIn: r.checkIn ?? undefined,
            communication: r.communication ?? undefined,
            location: r.location ?? undefined,
            value: r.value ?? undefined,
          }))} />

          {/* Cancellation / Refund policy */}
          <section className="mt-12">
            <h2 className="text-lg font-semibold">{tx.cancellationPolicy}</h2>
            <div className="mt-4 rounded-2xl border border-neutral-200 p-5 text-sm text-neutral-700 leading-7">
              <p className="font-semibold text-neutral-900 flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 shrink-0" />
                {tx.policyTitle}
              </p>
              <ul className="mt-4 list-disc pl-5 space-y-2">
                <li>{tx.policy24h}</li>
                <li>{tx.policyGeneral}</li>
                <li>{tx.policyLate}</li>
                {listing.nonRefundableSpecialEnabled && <li>{tx.policySpecial}</li>}
                <li>{tx.policyFee}</li>
              </ul>
              {cancelUntil && (
                <p className="mt-4 font-medium">
                  {tx.freeUntilPrefix} <span className="font-semibold">{cancelUntil}</span>
                </p>
              )}
              <p className="mt-3 text-xs text-neutral-500">{tx.kstAndLocal}</p>
              <p className="mt-2 text-xs text-neutral-500">{tx.instantPay}</p>
            </div>
          </section>
        </section>

        {/* Right: 데스크톱에서만 표시 (모바일은 위 블록 사용) */}
        <aside className="hidden h-fit lg:block lg:sticky lg:top-28">
          <BookingWidget
            listingId={String(listing.id)}
            basePricePerNightKRW={listing.pricePerNightKRW}
            nonRefundableSpecialEnabled={listing.nonRefundableSpecialEnabled}
            defaultStart={start}
            defaultEnd={end}
            defaultGuests={Number.isFinite(guests) ? guests : undefined}
          />
        </aside>
      </div>
    </Container>
  );
}
