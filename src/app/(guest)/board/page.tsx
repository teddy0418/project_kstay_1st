import type { Metadata } from "next";
import { getServerLang } from "@/lib/i18n/server";
import BoardPageClient from "./BoardPageClient";

const BOARD_META: Record<"en" | "ko" | "ja" | "zh", { title: string; description: string }> = {
  en: {
    title: "Food & Tips in Korea | KSTAY",
    description: "Discover restaurants, local tips, and travel hacks for your Korea stay.",
  },
  ko: {
    title: "한국 맛집 · 꿀팁 | KSTAY",
    description: "맛집, 현지 팁, 여행 꿀팁을 확인하세요.",
  },
  ja: {
    title: "韓国グルメ・コツ | KSTAY",
    description: "グルメ、現地情報、旅行ハックをチェック。",
  },
  zh: {
    title: "韩国美食与攻略 | KSTAY",
    description: "发现餐厅、当地小贴士与旅行技巧。",
  },
};

export async function generateMetadata(): Promise<Metadata> {
  const lang = await getServerLang();
  const m = BOARD_META[lang];
  return {
    title: m.title,
    description: m.description,
    openGraph: { title: m.title, description: m.description },
  };
}

export default function BoardPage() {
  return <BoardPageClient />;
}
