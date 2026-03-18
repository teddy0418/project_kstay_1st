"use client";

import EmptyState from "@/components/ui/EmptyState";
import { useI18n } from "@/components/ui/LanguageProvider";

const COPY = {
  en: { title: "Checkout error", desc: "Something went wrong during checkout. Your payment was not processed. Please try again.", back: "Back to Home", retry: "Try again" },
  ko: { title: "결제 오류", desc: "결제 중 오류가 발생했습니다. 결제가 처리되지 않았습니다. 다시 시도해 주세요.", back: "홈으로 돌아가기", retry: "다시 시도" },
  ja: { title: "決済エラー", desc: "決済中にエラーが発生しました。決済は処理されていません。もう一度お試しください。", back: "ホームに戻る", retry: "もう一度試す" },
  zh: { title: "结账错误", desc: "结账过程中出现错误，您的付款未被处理。请重试。", back: "返回首页", retry: "重试" },
} as const;

export default function CheckoutError({
  error: _error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  void _error;
  const { lang } = useI18n();
  const c = COPY[lang];

  return (
    <div className="min-h-[60vh]">
      <EmptyState
        title={c.title}
        description={c.desc}
        primaryHref="/"
        primaryLabel={c.back}
      />
      <div className="mx-auto w-full max-w-screen-sm px-4 pb-10 -mt-10">
        <button
          type="button"
          onClick={() => reset()}
          className="w-full rounded-2xl border border-neutral-200 bg-white px-6 py-4 text-sm font-semibold hover:bg-neutral-50 transition"
        >
          {c.retry}
        </button>
      </div>
    </div>
  );
}
