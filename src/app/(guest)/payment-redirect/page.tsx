"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useI18n } from "@/components/ui/LanguageProvider";
import { apiClient } from "@/lib/api/client";

type BookingLookup = {
  listing: { id: string };
  checkIn: string;
  checkOut: string;
  guests: { adults: number };
};

export default function PaymentRedirectPage() {
  const { lang } = useI18n();
  const c =
    lang === "ko"
      ? {
          failed: "결제 리디렉션에 실패했습니다",
          missing: "리디렉션 쿼리에 paymentId가 없습니다.",
          backHome: "홈으로 돌아가기",
          processing: "결제를 처리하고 있습니다...",
          checking: "리디렉션이 완료되어 서버에서 결제 상태를 확인 중입니다.",
        }
      : lang === "ja"
        ? {
            failed: "決済リダイレクトに失敗しました",
            missing: "リダイレクトクエリに paymentId がありません。",
            backHome: "ホームに戻る",
            processing: "決済を処理しています...",
            checking: "リダイレクト完了後、サーバーで決済状態を確認しています。",
          }
        : lang === "zh"
          ? {
              failed: "支付回跳失败",
              missing: "回跳参数中缺少 paymentId。",
              backHome: "返回首页",
              processing: "正在处理支付...",
              checking: "回跳已完成，服务器正在核验支付状态。",
            }
          : {
              failed: "Payment redirect failed",
              missing: "paymentId is missing from redirect query.",
              backHome: "Back to Home",
              processing: "Processing your payment...",
              checking: "Redirect completed. We are checking payment status on the server.",
            };
  const router = useRouter();
  const searchParams = useSearchParams();

  const paymentId = searchParams.get("paymentId") || "";
  const code = searchParams.get("code") || "";
  const message = searchParams.get("message") || "";
  const isFailure = code.startsWith("FAILURE_");

  useEffect(() => {
    if (!paymentId) return;
    const qs = searchParams.toString();

    if (isFailure) {
      void (async () => {
        try {
          const booking = await apiClient.get<BookingLookup>(
            `/api/bookings/public/${encodeURIComponent(paymentId)}`
          );
          if (!booking?.listing?.id) {
            router.replace("/?payment=cancelled");
            return;
          }
          const next = new URLSearchParams();
          if (booking.checkIn) next.set("start", booking.checkIn.slice(0, 10));
          if (booking.checkOut) next.set("end", booking.checkOut.slice(0, 10));
          if (booking.guests?.adults) next.set("guests", String(booking.guests.adults));
          next.set("payment", "cancelled");
          next.set("code", code || "FAILURE");
          router.replace(`/listings/${encodeURIComponent(booking.listing.id)}?${next.toString()}`);
        } catch {
          router.replace("/?payment=cancelled");
        }
      })();
      return;
    }

    const target = `/checkout/success/${encodeURIComponent(paymentId)}${qs ? `?${qs}` : ""}`;
    router.replace(target);
  }, [code, isFailure, paymentId, router, searchParams]);

  if (!paymentId) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-12">
        <h1 className="text-2xl font-semibold tracking-tight">{c.failed}</h1>
        <p className="mt-2 text-sm text-neutral-600">
          {code ? `Code: ${code}` : c.missing}
        </p>
        {message ? <p className="mt-1 text-sm text-neutral-600">{message}</p> : null}
        <Link href="/" className="mt-6 inline-flex rounded-xl bg-neutral-900 px-5 py-3 text-sm font-semibold text-white">
          {c.backHome}
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-2xl font-semibold tracking-tight">{c.processing}</h1>
      <p className="mt-2 text-sm text-neutral-600">
        {c.checking}
      </p>
    </main>
  );
}
