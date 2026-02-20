import EmptyState from "@/components/ui/EmptyState";
import { getServerLang } from "@/lib/i18n/server";

const COPY = {
  en: {
    title: "This page is being prepared",
    desc: "We're working on it. Please go back to the home page for now.",
    back: "Back to Home",
  },
  ko: {
    title: "페이지를 준비 중입니다",
    desc: "현재 작업 중입니다. 우선 홈 화면으로 이동해 주세요.",
    back: "홈으로 돌아가기",
  },
  ja: {
    title: "ページ準備中です",
    desc: "現在作業中です。いったんホームへお戻りください。",
    back: "ホームに戻る",
  },
  zh: {
    title: "页面正在准备中",
    desc: "我们正在处理该页面，请先返回首页。",
    back: "返回首页",
  },
} as const;

export default async function NotFound() {
  const lang = await getServerLang();
  const c = COPY[lang];
  return (
    <EmptyState
      title={c.title}
      description={c.desc}
      primaryHref="/"
      primaryLabel={c.back}
    />
  );
}
