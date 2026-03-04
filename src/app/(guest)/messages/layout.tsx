import type { Metadata } from "next";
import { getServerLang } from "@/lib/i18n/server";

const MESSAGES_META: Record<"en" | "ko" | "ja" | "zh", { title: string; description: string }> = {
  en: {
    title: "Messages | KSTAY",
    description: "Messaging with hosts is not available yet. For urgent questions, contact help@kstay.com.",
  },
  ko: {
    title: "메시지 | KSTAY",
    description: "호스트와의 메시지 기능은 준비 중입니다. 긴급 문의는 help@kstay.com으로 연락해 주세요.",
  },
  ja: {
    title: "メッセージ | KSTAY",
    description: "ホストとのメッセージ機能は準備中です。緊急の場合は help@kstay.com まで。",
  },
  zh: {
    title: "消息 | KSTAY",
    description: "与房东的 messaging 功能正在准备中。紧急问题请联系 help@kstay.com。",
  },
};

export async function generateMetadata(): Promise<Metadata> {
  const lang = await getServerLang();
  const m = MESSAGES_META[lang];
  return {
    title: m.title,
    description: m.description,
    openGraph: { title: m.title, description: m.description },
  };
}

export default function MessagesLayout({ children }: { children: React.ReactNode }) {
  return children;
}
