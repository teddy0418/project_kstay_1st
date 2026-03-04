import type { Metadata } from "next";
import { getServerLang } from "@/lib/i18n/server";

const WISHLIST_META: Record<"en" | "ko" | "ja" | "zh", { title: string; description: string }> = {
  en: {
    title: "Wishlist | KSTAY",
    description: "Stays you saved for later. Browse and book from your list.",
  },
  ko: {
    title: "위시리스트 | KSTAY",
    description: "나중에 보고 싶은 숙소를 저장해 두세요. 목록에서 둘러보고 예약하세요.",
  },
  ja: {
    title: "お気に入り | KSTAY",
    description: "後で見たい宿を保存できます。リストから探して予約しましょう。",
  },
  zh: {
    title: "心愿单 | KSTAY",
    description: "保存您稍后想看的住宿。从列表中浏览并预订。",
  },
};

export async function generateMetadata(): Promise<Metadata> {
  const lang = await getServerLang();
  const m = WISHLIST_META[lang];
  return {
    title: m.title,
    description: m.description,
    openGraph: { title: m.title, description: m.description },
  };
}

export default function WishlistLayout({ children }: { children: React.ReactNode }) {
  return children;
}
