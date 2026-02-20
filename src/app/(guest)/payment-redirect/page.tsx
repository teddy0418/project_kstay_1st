"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useI18n } from "@/components/ui/LanguageProvider";

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

  useEffect(() => {
    if (!paymentId) return;
    const qs = searchParams.toString();
    const target = `/checkout/success/${encodeURIComponent(paymentId)}${qs ? `?${qs}` : ""}`;
    router.replace(target);
  }, [paymentId, router, searchParams]);

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
