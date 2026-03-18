import type { Metadata } from "next";
import Container from "@/components/layout/Container";
import { getPublicListingById, getPublicListings } from "@/lib/repositories/listings";
import { findReviewsByListingId } from "@/lib/repositories/reviews";
import { ensureHostBioTranslated } from "@/lib/services/listing-translation";
import ListingGallery from "@/features/listings/components/ListingGallery";
import DetailActions from "@/features/listings/components/DetailActions";
import MapModal from "@/features/listings/components/MapModal";
import BookingWidget from "@/features/listings/components/BookingWidget";
import { getServerLang } from "@/lib/i18n/server";
import { langToLocale } from "@/lib/i18n/detect";
import { formatDate, addDays, parseISODate, formatNumber } from "@/lib/format";
import Link from "next/link";
import Image from "next/image";
import { ChevronRight, MapPin, Star, ShieldCheck } from "lucide-react";
import AmenitiesList from "@/features/listings/components/AmenitiesList";
import ReviewsSection, { type DbReview } from "@/features/listings/components/ReviewsSection";

const LISTING_DETAIL_ERROR_COPY: Record<
  "en" | "ko" | "ja" | "zh",
  { loadError: string; back: string }
> = {
  ko: {
    loadError: "이 숙소를 불러올 수 없습니다. 잠시 후 다시 시도해 주세요.",
    back: "홈으로 돌아가기",
  },
  en: {
    loadError: "We couldn't load this listing. Please try again in a moment.",
    back: "Back to Home",
  },
  ja: {
    loadError: "この宿泊先を読み込めませんでした。しばらくしてからもう一度お試しください。",
    back: "ホームに戻る",
  },
  zh: {
    loadError: "无法加载该房源，请稍后再试。",
    back: "返回首页",
  },
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id: rawParam } = await params;
  const id = rawParam ? decodeURIComponent(String(rawParam)) : "";
  const listing = id ? await getPublicListingById(id) : null;
  if (!listing) return { title: "KSTAY" };
  const title = `${listing.title} | KSTAY`;
  const description = [listing.location, listing.address].filter(Boolean).join(" · ") || undefined;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://kstay.co.kr";
  const firstUrl = listing.images?.[0];
  const ogImage = firstUrl
    ? firstUrl.startsWith("http")
      ? firstUrl
      : `${siteUrl}${firstUrl}`
    : undefined;
  return {
    title,
    ...(description && { description }),
    openGraph: {
      title,
      ...(description && { description }),
      type: "website",
      url: `${siteUrl}/listings/${id}`,
      siteName: "KSTAY",
      ...(ogImage && { images: [{ url: ogImage, width: 1200, height: 630, alt: listing.title }] }),
    },
  };
}

function normalizeId(v: unknown) {
  if (v == null) return "";
  return String(v);
}

function freeCancelUntilKST(locale: string, checkInISO?: string) {
  if (!checkInISO) return null;
  const checkIn = parseISODate(checkInISO);
  const deadline = addDays(checkIn, -5);
  return `${formatDate(locale, deadline)} 23:59 (KST)`;
}

function localizeHostBio(
  listing: { id: string; hostBio: string; hostBioI18n?: { en?: string; ko?: string; ja?: string; zh?: string } },
  fallbackBio: string,
  lang: "en" | "ko" | "ja" | "zh"
) {
  if (lang === "en" && listing.hostBioI18n?.en) return listing.hostBioI18n.en;
  if (lang === "ko" && listing.hostBioI18n?.ko) return listing.hostBioI18n.ko;
  if (lang === "ja" && listing.hostBioI18n?.ja) return listing.hostBioI18n.ja;
  if (lang === "zh" && listing.hostBioI18n?.zh) return listing.hostBioI18n.zh;

  const table: Record<string, Record<"en" | "ko" | "ja" | "zh", string>> = {
    "seoul-seongsu-studio": {
      en: "Local host in Seoul. Clear English check-in guide and simple house rules.",
      ko: "서울 로컬 호스트입니다. 명확한 체크인 가이드와 간단한 하우스 룰을 제공합니다.",
      ja: "ソウル在住ホストです。分かりやすいチェックイン案内とシンプルなハウスルールをご用意しています。",
      zh: "首爾本地房東，提供清晰的入住指引與簡潔的房屋規則。",
    },
    "seoul-bukchon-hanok": {
      en: "Peaceful hanok stay with detailed instructions for international guests.",
      ko: "해외 게스트도 쉽게 이용할 수 있도록 상세 안내를 제공하는 조용한 한옥 숙소입니다.",
      ja: "海外ゲスト向けの詳細案内がある、静かな韓屋ステイです。",
      zh: "安靜的韓屋住宿，並為國際旅客提供詳細入住說明。",
    },
    "busan-haeundae-ocean": {
      en: "Busan local host. Quick replies and easy check-in.",
      ko: "부산 로컬 호스트로 빠른 응답과 쉬운 체크인을 제공합니다.",
      ja: "釜山ローカルホスト。返信が早く、チェックインも簡単です。",
      zh: "釜山本地房東，回覆及時，入住流程簡單。",
    },
    "jeju-aewol-stonehouse": {
      en: "Jeju host. Slow, peaceful vibes and clear English guidance.",
      ko: "제주의 느리고 평화로운 분위기를 담은 숙소로, 명확한 영어 안내를 제공합니다.",
      ja: "済州のゆったりした空気を感じられる宿で、英語案内も分かりやすいです。",
      zh: "濟州風格的慢節奏寧靜住宿，並提供清晰的英文引導。",
    },
    "incheon-airport-stay": {
      en: "Airport-friendly host. Great for late arrivals with quick check-in.",
      ko: "공항 접근이 좋아 늦은 도착에도 빠르게 체크인할 수 있는 숙소입니다.",
      ja: "空港アクセスに優れ、深夜到着でもスムーズにチェックインできます。",
      zh: "靠近機場，適合晚到旅客，可快速辦理入住。",
    },
  };

  return table[listing.id]?.[lang] ?? fallbackBio;
}

export default async function ListingDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const lang = await getServerLang();
  const locale = langToLocale(lang);
  const tx =
    lang === "ko"
      ? {
          notFound: "숙소를 찾을 수 없습니다",
          availableIds: "사용 가능한 숙소 ID",
          home: "홈",
          reviews: "리뷰",
          newBadge: "신규",
          noReviews: "아직 리뷰가 없습니다. 첫 번째 리뷰를 남겨보세요!",
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
            newBadge: "新着",
            noReviews: "まだレビューがありません。最初のレビューを投稿してみましょう！",
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
              newBadge: "新上架",
              noReviews: "还没有评价。成为第一个写评价的人吧！",
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
              newBadge: "New",
              noReviews: "No reviews yet. Be the first to leave a review!",
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
  try {
  const { id: rawParam } = await params;
  const raw = rawParam ?? "";
  const id = decodeURIComponent(raw);
  const localeStr = langToLocale(lang);

  let listing = (await getPublicListingById(id)) ?? (await getPublicListingById(raw));

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

  listing = await ensureHostBioTranslated(listing, lang);

  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const start = typeof resolvedSearchParams?.start === "string" ? resolvedSearchParams.start : undefined;
  const end = typeof resolvedSearchParams?.end === "string" ? resolvedSearchParams.end : undefined;
  const guests = typeof resolvedSearchParams?.guests === "string" ? Number(resolvedSearchParams.guests) : undefined;

  const dbReviews = await findReviewsByListingId(listing.id);
  const reviewCount =
    dbReviews.length > 0 ? dbReviews.length : Number((listing as { reviewCount?: number }).reviewCount ?? 0) || 0;

  const featuredReview = dbReviews.length > 0
    ? [...dbReviews].sort((a, b) => {
        if (b.rating !== a.rating) return b.rating - a.rating;
        return (b.body?.length ?? 0) - (a.body?.length ?? 0);
      })[0]
    : null;

  const cancelUntil = freeCancelUntilKST(localeStr, start);

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
            {reviewCount > 0 ? (
              <>
                <span className="inline-flex items-center gap-1 text-neutral-900">
                  <Star className="h-4 w-4" />
                  <span className="font-medium">{listing.rating.toFixed(2)}</span>
                </span>
                <span>·</span>
                <a href="#reviews" className="hover:underline">
                  {formatNumber(localeStr, reviewCount)} {tx.reviews}
                </a>
              </>
            ) : (
              <span className="inline-flex items-center gap-1">
                <Star className="h-4 w-4 text-neutral-900" />
                <span className="font-semibold text-neutral-900">{tx.newBadge}</span>
              </span>
            )}
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
            {reviewCount > 0 ? (
              <>
                <span className="inline-flex items-center gap-1 rounded-full bg-neutral-900 px-3 py-1 text-xs font-semibold text-white">
                  <Star className="h-4 w-4" />
                  {listing.rating.toFixed(2)}
                </span>
                <div className="text-sm font-semibold">{formatNumber(localeStr, reviewCount)} {tx.reviews}</div>
              </>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-full bg-neutral-900 px-3 py-1 text-xs font-semibold text-white">
                <Star className="h-4 w-4" />
                {tx.newBadge}
              </span>
            )}
          </div>
          <p className="mt-3 text-sm text-neutral-600 leading-6 line-clamp-3">
            {featuredReview
              ? `"${(featuredReview.body ?? "").slice(0, 120)}${(featuredReview.body?.length ?? 0) > 120 ? "…" : ""}" — ${(featuredReview.user?.displayName?.trim() || featuredReview.user?.name) ?? "Guest"}`
              : tx.noReviews}
          </p>
          {reviewCount > 0 && <div className="mt-4 text-sm font-semibold text-neutral-900">{tx.viewReviews}</div>}
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
                title={tx.mapPreview}
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
          <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-neutral-200 p-5 sm:gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-neutral-200 text-lg font-semibold text-neutral-700">
              {(listing.hostName?.trim().slice(0, 1).toUpperCase()) || "H"}
            </div>
            <div className="min-w-0 flex-1 flex items-center justify-between gap-3">
              <span className="text-base font-semibold text-neutral-900 sm:text-lg">{tx.hostedBy} {listing.hostName}</span>
              <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-neutral-900 px-2 py-0.5 text-[10px] font-semibold text-white whitespace-nowrap sm:gap-1.5 sm:px-2.5 sm:py-1 sm:text-[11px]">
                <ShieldCheck className="h-3 w-3 shrink-0 text-[#E73587] sm:h-3.5 sm:w-3.5" aria-hidden />
                {tx.govCertified}
              </span>
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

          <ReviewsSection rating={listing.rating} count={reviewCount} lang={lang} locale={localeStr} dbReviews={dbReviews.map((r) => ({
            id: r.id,
            userId: r.user?.id,
            userName: (r.user?.displayName?.trim() || r.user?.name) ?? "Guest",
            userImage: r.user?.profilePhotoUrl?.trim() || null,
            rating: r.rating,
            body: r.body,
            bodyEn: r.bodyEn ?? undefined,
            bodyKo: r.bodyKo ?? undefined,
            bodyJa: r.bodyJa ?? undefined,
            bodyZh: r.bodyZh ?? undefined,
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
                <ShieldCheck className="h-5 w-5 shrink-0 text-[#E73587]" />
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
  } catch (e) {
    console.error("[listings/[id]]", e);
    const c = LISTING_DETAIL_ERROR_COPY[lang];
    return (
      <Container className="py-10">
        <h1 className="text-xl font-semibold tracking-tight">{c.loadError}</h1>
        <Link
          href="/"
          className="mt-4 inline-flex rounded-xl border border-neutral-200 px-4 py-2 text-sm font-semibold hover:bg-neutral-50"
        >
          {c.back}
        </Link>
      </Container>
    );
  }
}
