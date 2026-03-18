"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { Copy, Check, ChevronDown, ChevronUp } from "lucide-react";
import { apiClient, ApiClientError } from "@/lib/api/client";
import { useI18n } from "@/components/ui/LanguageProvider";
import { useToast } from "@/components/ui/ToastProvider";
import { formatKRWWithLocale, formatDate } from "@/lib/format";

type PublicBooking = {
  token: string;
  status: "PENDING_PAYMENT" | "CONFIRMED" | "CANCELLED";
  guestEmail?: string;
  listing: { id: string; title: string; city: string; area: string; address: string; checkInTime?: string; imageUrl?: string | null };
  checkIn: string;
  checkOut: string;
  checkInText: string;
  checkOutText: string;
  nights: number;
  guests: { adults: number; children: number; infants: number; pets: number };
  totals: {
    usdText: string;
    krw: number;
    paymentAmountFormatted: string | null;
    approxLocalFormatted: string | null;
    settlementDisclaimer: string | null;
  };
  cancellationDeadlineKst: string;
};

export default function CheckoutSuccessPage() {
  const { toast } = useToast();
  const { lang, locale } = useI18n();
  const c =
    lang === "ko"
      ? {
          processingBooking: "예약 처리 중...",
          waitConfirm: "결제를 확인하는 동안 잠시만 기다려 주세요.",
          notFound: "예약 정보를 찾을 수 없습니다",
          checkLink: "예약 링크를 다시 확인해 주세요.",
          backHome: "홈으로 돌아가기",
          redirectReported: "결제 리디렉션 알림",
          confirmed: "예약이 확정되었습니다",
          processing: "처리 중...",
          confirmedDesc: "예약이 확정되었고 확인 이메일을 발송했습니다.",
          emailSentTo: "인보이스·확인 메일 발송",
          processingDesc: "결제를 처리 중입니다. 이 페이지는 자동으로 갱신됩니다.",
          bookingLink: "예약 링크",
          dates: "일정",
          nights: "박",
          guests: "인원",
          total: "총 결제금액",
          cancellation: "무료 취소 가능 기한",
          goProfile: "프로필로 이동",
          adults: "성인",
          children: "아동",
          infants: "유아",
          pets: "반려동물",
          cancelReservation: "예약 취소",
          cancelConfirm: "취소하시겠어요? 전액 환불됩니다.",
          cancelled: "예약이 취소되었습니다",
          cancelFailed: "취소할 수 없습니다 (무료 취소 기한이 지났을 수 있습니다).",
          copyLink: "링크 복사",
          copied: "링크 복사됨",
          viewBooking: "예약 상세 보기",
          checkInTime: "체크인",
          showDetails: "상세 정보",
          hideDetails: "접기",
        }
      : lang === "ja"
        ? {
            processingBooking: "予約を処理中...",
            waitConfirm: "決済確認中です。しばらくお待ちください。",
            notFound: "予約が見つかりません",
            checkLink: "予約リンクを再確認してください。",
            backHome: "ホームに戻る",
            redirectReported: "決済リダイレクト通知",
            confirmed: "予約が確定しました",
            processing: "処理中...",
            confirmedDesc: "予約が確定し、確認メールを送信しました。",
            emailSentTo: "請求書・確認メール送信先",
            processingDesc: "決済を処理中です。このページは自動更新されます。",
            bookingLink: "予約リンク",
            dates: "日程",
            nights: "泊",
            guests: "人数",
            total: "合計",
            cancellation: "無料キャンセル期限",
            goProfile: "プロフィールへ",
            adults: "大人",
            children: "子ども",
            infants: "幼児",
            pets: "ペット",
            cancelReservation: "予約をキャンセル",
            cancelConfirm: "キャンセルすると全額返金されます。よろしいですか？",
            cancelled: "予約をキャンセルしました",
            cancelFailed: "キャンセルできません（無料キャンセル期間を過ぎている可能性があります）。",
            copyLink: "リンクをコピー",
            copied: "リンクをコピーしました",
            viewBooking: "予約詳細を見る",
            checkInTime: "チェックイン",
            showDetails: "詳細を見る",
            hideDetails: "閉じる",
          }
        : lang === "zh"
          ? {
              processingBooking: "正在处理您的预订...",
              waitConfirm: "我们正在确认支付，请稍候。",
              notFound: "未找到预订信息",
              checkLink: "请检查预订链接是否正确。",
              backHome: "返回首页",
              redirectReported: "支付回跳提示",
              confirmed: "预订已确认",
              processing: "处理中...",
              confirmedDesc: "您的预订已确认，确认邮件已发送。",
              emailSentTo: "发票·确认邮件发送至",
              processingDesc: "我们仍在处理支付，该页面会自动刷新。",
              bookingLink: "预订链接",
              dates: "日期",
              nights: "晚",
              guests: "人数",
              total: "总计",
              cancellation: "免费取消截止",
              goProfile: "前往个人资料",
              adults: "成人",
              children: "儿童",
              infants: "婴儿",
              pets: "宠物",
              cancelReservation: "取消预订",
              cancelConfirm: "确定要取消吗？您将获得全额退款。",
              cancelled: "已取消预订",
              cancelFailed: "无法取消（可能已过免费取消期限）。",
              copyLink: "复制链接",
              copied: "链接已复制",
              viewBooking: "查看预订详情",
              checkInTime: "入住时间",
              showDetails: "查看详情",
              hideDetails: "收起",
            }
          : {
              processingBooking: "Processing your booking...",
              waitConfirm: "Please wait while we confirm your payment.",
              notFound: "Booking not found",
              checkLink: "Please check your booking link again.",
              backHome: "Back to Home",
              redirectReported: "Payment redirect reported",
              confirmed: "Booking confirmed",
              processing: "Processing...",
              confirmedDesc: "Your booking is confirmed. A confirmation email has been sent.",
              emailSentTo: "Invoice & confirmation sent to",
              processingDesc: "We are still processing your payment. This page refreshes automatically.",
              bookingLink: "Booking link",
              dates: "Dates",
              nights: "nights",
              guests: "Guests",
              total: "Total",
              cancellation: "Free cancellation until",
              goProfile: "Go to Profile",
              adults: "adults",
              children: "children",
              infants: "infants",
              pets: "pets",
              cancelReservation: "Cancel reservation",
              cancelConfirm: "Are you sure? You will get a full refund.",
              cancelled: "Reservation cancelled",
              cancelFailed: "Cannot cancel (free cancellation period may have ended).",
              copyLink: "Copy link",
              copied: "Link copied",
              viewBooking: "View booking details",
              checkInTime: "Check-in",
              showDetails: "Show details",
              hideDetails: "Hide",
            };
  const params = useParams<{ token: string }>();
  const searchParams = useSearchParams();
  const token = String(params?.token ?? "");
  const redirectCode = searchParams.get("code") || "";
  const redirectMessage = searchParams.get("message") || "";
  const [booking, setBooking] = useState<PublicBooking | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [showDetailsExpanded, setShowDetailsExpanded] = useState(false);
  const [bookingUrl, setBookingUrl] = useState("");

  useEffect(() => {
    if (!booking?.token || typeof window === "undefined") return;
    const base = (process.env.NEXT_PUBLIC_SITE_URL || window.location.origin).replace(/\/$/, "");
    setBookingUrl(`${base}/checkout/success/${booking.token}`);
  }, [booking?.token]);

  const handleCopyLink = useCallback(() => {
    if (!bookingUrl) return;
    void navigator.clipboard.writeText(bookingUrl).then(() => {
      setLinkCopied(true);
      toast(c.copied);
      setTimeout(() => setLinkCopied(false), 2000);
    });
  }, [bookingUrl, toast, c.copied]);

  const handleCancelClick = useCallback(() => {
    if (!booking || booking.status !== "CONFIRMED") return;
    setCancelModalOpen(true);
  }, [booking]);

  const handleCancelConfirm = useCallback(async () => {
    if (!token || !booking || booking.status !== "CONFIRMED") return;
    setCancelModalOpen(false);
    setCancelling(true);
    try {
      await apiClient.post(`/api/bookings/public/${token}/cancel`);
      setBooking((prev) => (prev ? { ...prev, status: "CANCELLED" } : null));
    } catch (err) {
      const msg = err instanceof ApiClientError && err.code === "FREE_CANCEL_EXPIRED" ? c.cancelFailed : c.cancelFailed;
      toast(msg);
    } finally {
      setCancelling(false);
    }
  }, [token, booking, c.cancelFailed, toast]);

  useEffect(() => {
    if (!token) return;
    let active = true;
    let attempts = 0;

    const verifyPayment = async () => {
      try {
        const result = await apiClient.post<{ status: string; recovered: boolean }>(`/api/bookings/verify/${token}`);
        if (!active) return;
        if (result.recovered || result.status === "CONFIRMED") {
          void fetchBooking();
          return;
        }
      } catch {
        // verification unavailable
      }
      if (active) setLoading(false);
    };

    const fetchBooking = async () => {
      try {
        const data = await apiClient.get<PublicBooking>(`/api/bookings/public/${token}`);
        if (!active) return;
        setBooking(data);
        if (data.status === "PENDING_PAYMENT" && attempts < 10) {
          attempts += 1;
          setTimeout(fetchBooking, 2500);
          return;
        }
      } catch {
        if (attempts >= 10) {
          void verifyPayment();
          return;
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    void fetchBooking();
    return () => {
      active = false;
    };
  }, [token]);

  const guestsText = useMemo(() => {
    if (!booking) return "";
    return `${booking.guests.adults} ${c.adults}, ${booking.guests.children} ${c.children}, ${booking.guests.infants} ${c.infants}, ${booking.guests.pets} ${c.pets}`;
  }, [booking, c.adults, c.children, c.infants, c.pets]);

  const datesFormatted = useMemo(() => {
    if (!booking) return "";
    return `${formatDate(locale, booking.checkIn)} - ${formatDate(locale, booking.checkOut)} (${booking.nights} ${c.nights})`;
  }, [booking, locale, c.nights]);

  if (loading) {
    return (
      <main className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="mx-auto max-w-md px-4 text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-2 border-neutral-200 border-t-neutral-600" />
          <h1 className="mt-4 text-xl font-semibold text-neutral-900">{c.processingBooking}</h1>
          <p className="mt-2 text-sm text-neutral-600">{c.waitConfirm}</p>
        </div>
      </main>
    );
  }

  if (!booking) {
    return (
      <main className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="mx-auto max-w-md px-4 text-center">
          <h1 className="text-xl font-semibold text-neutral-900">{c.notFound}</h1>
          <p className="mt-2 text-sm text-neutral-600">{c.checkLink}</p>
          <Link
            href="/"
            className="mt-6 inline-flex rounded-xl bg-neutral-900 px-5 py-3 text-sm font-semibold text-white hover:bg-neutral-800"
          >
            {c.backHome}
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-neutral-50">
      <div className="mx-auto max-w-2xl px-4 py-8 sm:py-12">
        {redirectCode ? (
          <section className="mb-6 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            {c.redirectReported}: {redirectCode}
            {redirectMessage ? ` - ${redirectMessage}` : ""}
          </section>
        ) : null}

        {/* Success hero */}
        <div className="text-center mb-8">
          <div
            className={`mx-auto flex h-16 w-16 items-center justify-center rounded-full ${booking.status === "CONFIRMED" ? "bg-emerald-100" : "bg-amber-100"}`}
          >
            <Check className={`h-9 w-9 ${booking.status === "CONFIRMED" ? "text-emerald-600" : "text-amber-600"}`} strokeWidth={2.5} />
          </div>
          <h1 className="mt-4 text-2xl font-bold tracking-tight text-neutral-900 sm:text-3xl">
            {booking.status === "CONFIRMED" ? c.confirmed : c.processing}
          </h1>
          <p className="mt-2 text-base text-neutral-600">
            {booking.status === "CONFIRMED" ? c.confirmedDesc : c.processingDesc}
          </p>
        </div>

        {/* Property card - Airbnb/Booking style */}
        <Link
          href={`/listings/${booking.listing.id}`}
          className="block overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm transition hover:shadow-md"
        >
          <div className="flex flex-col sm:flex-row">
            <div className="relative h-40 w-full shrink-0 sm:h-36 sm:w-44 bg-neutral-200">
              {booking.listing.imageUrl ? (
                <img
                  src={booking.listing.imageUrl}
                  alt={booking.listing.title}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-4xl font-semibold text-neutral-400">
                  {booking.listing.title.slice(0, 1)}
                </div>
              )}
            </div>
            <div className="flex flex-1 flex-col justify-center p-4 sm:p-5">
              <h2 className="text-lg font-semibold text-neutral-900">{booking.listing.title}</h2>
              <p className="mt-0.5 text-sm text-neutral-600">
                {booking.listing.city} · {booking.listing.area}
              </p>
              <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm text-neutral-700">
                <span>{datesFormatted}</span>
                <span>·</span>
                <span>{guestsText}</span>
              </div>
              <p className="mt-2 text-lg font-bold text-neutral-900">
                {booking.totals.paymentAmountFormatted ??
                  `${booking.totals.usdText} / ${formatKRWWithLocale(locale, booking.totals.krw)}`}
              </p>
              {booking.totals.approxLocalFormatted && (
                <p className="text-xs text-neutral-500">{booking.totals.approxLocalFormatted}</p>
              )}
            </div>
          </div>
        </Link>

        {/* Key info strip */}
        <div className="mt-6 rounded-2xl border border-neutral-200 bg-white p-4 sm:p-5">
          <div className="grid gap-3 sm:grid-cols-2">
            {booking.listing.checkInTime && (
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-neutral-500">{c.checkInTime}</p>
                <p className="mt-0.5 font-semibold text-neutral-900">{booking.listing.checkInTime}</p>
              </div>
            )}
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-neutral-500">{c.cancellation}</p>
              <p className="mt-0.5 font-semibold text-neutral-900">{booking.cancellationDeadlineKst}</p>
            </div>
          </div>
          {booking.totals.settlementDisclaimer && (
            <p className="mt-3 text-xs text-neutral-500">{booking.totals.settlementDisclaimer}</p>
          )}

          {/* Collapsible details */}
          <div className="mt-4 border-t border-neutral-100 pt-4">
            <button
              type="button"
              onClick={() => setShowDetailsExpanded((v) => !v)}
              className="flex w-full items-center justify-between text-sm font-medium text-neutral-600 hover:text-neutral-900"
            >
              {showDetailsExpanded ? c.hideDetails : c.showDetails}
              {showDetailsExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>
            {showDetailsExpanded && (
              <div className="mt-3 space-y-2 text-sm text-neutral-600">
                <div className="flex flex-wrap items-center gap-2">
                  <strong className="text-neutral-700">{c.bookingLink}:</strong>
                  <span className="font-mono text-neutral-700 truncate max-w-[200px] sm:max-w-none" title={bookingUrl}>
                    {bookingUrl || booking.token}
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyLink}
                    className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-neutral-200 px-2 py-1 text-xs font-medium text-neutral-600 hover:bg-neutral-50 transition"
                    aria-label={c.copyLink}
                  >
                    {linkCopied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                    {linkCopied ? c.copied : c.copyLink}
                  </button>
                </div>
                <p className="text-neutral-600">{booking.listing.address}</p>
                {booking.guestEmail && (
                  <p>
                    <strong className="text-neutral-700">{c.emailSentTo}:</strong>{" "}
                    <span className="font-mono">{booking.guestEmail}</span>
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* CTAs */}
        <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/"
            className="rounded-xl border border-neutral-200 bg-white px-6 py-3.5 text-center text-sm font-semibold text-neutral-900 shadow-sm hover:bg-neutral-50"
          >
            {c.backHome}
          </Link>
          <Link
            href="/profile"
            className="rounded-xl bg-neutral-900 px-6 py-3.5 text-center text-sm font-semibold text-white shadow-sm hover:bg-neutral-800"
          >
            {c.viewBooking}
          </Link>
          {booking.status === "CONFIRMED" && (
            <button
              type="button"
              onClick={handleCancelClick}
              disabled={cancelling}
              className="rounded-xl border border-red-200 bg-white px-6 py-3.5 text-sm font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50"
            >
              {cancelling ? "..." : c.cancelReservation}
            </button>
          )}
        </div>

        {booking.status === "CANCELLED" && (
          <p className="mt-6 text-center text-sm font-medium text-neutral-600">{c.cancelled}</p>
        )}
      </div>

      {cancelModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setCancelModalOpen(false)} aria-hidden />
          <div className="relative rounded-2xl border border-neutral-200 bg-white p-6 shadow-xl max-w-sm w-full">
            <p className="text-center text-sm font-medium text-neutral-800">{c.cancelConfirm}</p>
            <div className="mt-4 flex gap-3">
              <button
                type="button"
                onClick={() => setCancelModalOpen(false)}
                className="flex-1 rounded-xl border border-neutral-200 px-4 py-2.5 text-sm font-semibold hover:bg-neutral-50"
              >
                {lang === "ko" ? "아니오" : lang === "ja" ? "いいえ" : lang === "zh" ? "否" : "No"}
              </button>
              <button
                type="button"
                onClick={() => void handleCancelConfirm()}
                disabled={cancelling}
                className="flex-1 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
              >
                {cancelling ? "..." : (lang === "ko" ? "예, 취소" : lang === "ja" ? "はい、キャンセル" : lang === "zh" ? "是，取消" : "Yes, cancel")}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
