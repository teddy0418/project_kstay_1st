"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { apiClient } from "@/lib/api/client";
import { useI18n } from "@/components/ui/LanguageProvider";

type PublicBooking = {
  token: string;
  status: "PENDING_PAYMENT" | "CONFIRMED" | "CANCELLED";
  listing: { id: string; title: string; city: string; area: string; address: string };
  checkInText: string;
  checkOutText: string;
  nights: number;
  guests: { adults: number; children: number; infants: number; pets: number };
  totals: { usdText: string; krw: number };
  cancellationDeadlineKst: string;
};

export default function CheckoutSuccessPage() {
  const { lang } = useI18n();
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
          processingDesc: "결제를 처리 중입니다. 이 페이지는 자동으로 갱신됩니다.",
          bookingToken: "예약 토큰",
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
            processingDesc: "決済を処理中です。このページは自動更新されます。",
            bookingToken: "予約トークン",
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
              processingDesc: "我们仍在处理支付，该页面会自动刷新。",
              bookingToken: "预订令牌",
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
              processingDesc: "We are still processing your payment. This page refreshes automatically.",
              bookingToken: "Booking token",
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
            };
  const params = useParams<{ token: string }>();
  const searchParams = useSearchParams();
  const token = String(params?.token ?? "");
  const redirectCode = searchParams.get("code") || "";
  const redirectMessage = searchParams.get("message") || "";
  const [booking, setBooking] = useState<PublicBooking | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    let active = true;
    let attempts = 0;

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
        // keep fallback view
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

  if (loading) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-12">
        <h1 className="text-2xl font-semibold tracking-tight">{c.processingBooking}</h1>
        <p className="mt-2 text-sm text-neutral-600">{c.waitConfirm}</p>
      </main>
    );
  }

  if (!booking) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-12">
        <h1 className="text-2xl font-semibold tracking-tight">{c.notFound}</h1>
        <p className="mt-2 text-sm text-neutral-600">{c.checkLink}</p>
        <Link href="/" className="mt-6 inline-flex rounded-xl bg-neutral-900 px-5 py-3 text-sm font-semibold text-white">
          {c.backHome}
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-12">
      {redirectCode ? (
        <section className="mb-4 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          {c.redirectReported}: {redirectCode}
          {redirectMessage ? ` - ${redirectMessage}` : ""}
        </section>
      ) : null}
      <h1 className="text-2xl font-semibold tracking-tight">
        {booking.status === "CONFIRMED" ? c.confirmed : c.processing}
      </h1>
      <p className="mt-2 text-sm text-neutral-600">
        {booking.status === "CONFIRMED"
          ? c.confirmedDesc
          : c.processingDesc}
      </p>

      <section className="mt-6 rounded-2xl border border-neutral-200 bg-white p-6">
        <div className="text-lg font-semibold">{booking.listing.title}</div>
        <div className="mt-1 text-sm text-neutral-600">
          {booking.listing.city} · {booking.listing.area}
        </div>
        <div className="mt-1 text-sm text-neutral-600">{booking.listing.address}</div>
        <div className="mt-4 grid gap-1 text-sm">
          <div><strong>{c.bookingToken}:</strong> {booking.token}</div>
          <div><strong>{c.dates}:</strong> {booking.checkInText} - {booking.checkOutText} ({booking.nights} {c.nights})</div>
          <div><strong>{c.guests}:</strong> {guestsText}</div>
          <div><strong>{c.total}:</strong> {booking.totals.usdText} / ₩{booking.totals.krw.toLocaleString()}</div>
          <div><strong>{c.cancellation}:</strong> {booking.cancellationDeadlineKst}</div>
        </div>
      </section>

      <div className="mt-6 flex gap-3">
        <Link href="/profile" className="rounded-xl bg-neutral-900 px-5 py-3 text-sm font-semibold text-white">
          {c.goProfile}
        </Link>
        <Link href="/" className="rounded-xl border border-neutral-200 px-5 py-3 text-sm font-semibold">
          {c.backHome}
        </Link>
      </div>
    </main>
  );
}
