import EmptyState from "@/components/ui/EmptyState";
import { getServerLang } from "@/lib/i18n/server";

const COPY = {
  en: {
    title: "Page not found",
    desc: "The page you're looking for doesn't exist or has been moved. Let's get you back on track.",
    back: "Back to Home",
  },
  ko: {
    title: "페이지를 찾을 수 없습니다",
    desc: "요청하신 페이지가 존재하지 않거나 이동되었습니다. 홈으로 돌아가 주세요.",
    back: "홈으로 돌아가기",
  },
  ja: {
    title: "ページが見つかりません",
    desc: "お探しのページは存在しないか、移動された可能性があります。ホームへお戻りください。",
    back: "ホームに戻る",
  },
  zh: {
    title: "页面未找到",
    desc: "您访问的页面不存在或已被移动，请返回首页。",
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
