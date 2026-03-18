"use client";

import EmptyState from "@/components/ui/EmptyState";
import { useI18n } from "@/components/ui/LanguageProvider";

const COPY = {
  en: { title: "Something went wrong", desc: "An unexpected error occurred. Please try again.", back: "Back to Home", retry: "Try again" },
  ko: { title: "오류가 발생했습니다", desc: "예기치 않은 오류가 발생했습니다. 다시 시도해 주세요.", back: "홈으로 돌아가기", retry: "다시 시도" },
  ja: { title: "エラーが発生しました", desc: "予期しないエラーが発生しました。もう一度お試しください。", back: "ホームに戻る", retry: "もう一度試す" },
  zh: { title: "出现了错误", desc: "发生了意外错误，请重试。", back: "返回首页", retry: "重试" },
} as const;

export default function GlobalError({
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
    <div className="bg-[#F9FAFB] min-h-screen">
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
