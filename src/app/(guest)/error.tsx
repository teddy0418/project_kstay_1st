"use client";

import Link from "next/link";
import { useI18n } from "@/components/ui/LanguageProvider";

const COPY = {
  en: { title: "Something went wrong", desc: "An unexpected error occurred. Please try again.", back: "Back to Home", retry: "Try again" },
  ko: { title: "오류가 발생했습니다", desc: "예기치 않은 오류가 발생했습니다. 다시 시도해 주세요.", back: "홈으로 돌아가기", retry: "다시 시도" },
  ja: { title: "エラーが発生しました", desc: "予期しないエラーが発生しました。もう一度お試しください。", back: "ホームに戻る", retry: "もう一度試す" },
  zh: { title: "出现了错误", desc: "发生了意外错误，请重试。", back: "返回首页", retry: "重试" },
} as const;

export default function GuestError({
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
    <main className="mx-auto max-w-lg px-4 py-24 text-center">
      <h1 className="text-2xl font-semibold tracking-tight">{c.title}</h1>
      <p className="mt-3 text-sm text-neutral-600">{c.desc}</p>
      <div className="mt-8 flex flex-col gap-3">
        <button
          type="button"
          onClick={() => reset()}
          className="rounded-xl bg-neutral-900 px-5 py-3 text-sm font-semibold text-white hover:opacity-90 transition"
        >
          {c.retry}
        </button>
        <Link
          href="/"
          className="rounded-xl border border-neutral-200 px-5 py-3 text-sm font-semibold hover:bg-neutral-50 transition"
        >
          {c.back}
        </Link>
      </div>
    </main>
  );
}
