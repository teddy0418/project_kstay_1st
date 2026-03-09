import EmptyState from "@/components/ui/EmptyState";
import { getServerLang } from "@/lib/i18n/server";

const COPY = {
  en: { title: "Page coming soon", desc: "This feature is not available yet. We're preparing it.", back: "Back to Home", help: "Help Center" },
  ko: { title: "페이지 준비 중", desc: "아직 제공되지 않는 기능입니다. 빠르게 준비하고 있습니다.", back: "홈으로 돌아가기", help: "도움말 센터" },
  ja: { title: "ページ準備中", desc: "この機能はまだ利用できません。現在準備中です。", back: "ホームに戻る", help: "ヘルプセンター" },
  zh: { title: "頁面即將上線", desc: "此功能暫未開放，我們正在準備中。", back: "返回首頁", help: "幫助中心" },
} as const;

export default async function ComingSoonPage() {
  const lang = await getServerLang();
  const c = COPY[lang];
  return (
    <EmptyState
      title={c.title}
      description={c.desc}
      primaryHref="/"
      primaryLabel={c.back}
      secondaryHref="/help"
      secondaryLabel={c.help}
    />
  );
}
