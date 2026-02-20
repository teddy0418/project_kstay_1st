import Container from "@/components/layout/Container";
import Link from "next/link";
import { getPublicListings } from "@/lib/repositories/listings";
import { getServerLang } from "@/lib/i18n/server";

const COPY = {
  en: {
    title: "Listings (debug)",
    subtitle: "If detail navigation fails, click an ID below to verify routing.",
  },
  ko: {
    title: "숙소 목록 (디버그)",
    subtitle: "상세 이동이 실패하면 아래 ID를 눌러 라우팅을 확인하세요.",
  },
  ja: {
    title: "宿一覧 (デバッグ)",
    subtitle: "詳細ページ遷移に失敗する場合は、下のIDをクリックしてルーティングを確認してください。",
  },
  zh: {
    title: "房源列表（调试）",
    subtitle: "如果详情页跳转失败，请点击下方 ID 以验证路由。",
  },
} as const;

export default async function ListingsIndexPage() {
  const lang = await getServerLang();
  const c = COPY[lang];
  const listings = await getPublicListings();
  return (
    <Container className="py-10">
      <h1 className="text-2xl font-semibold tracking-tight">{c.title}</h1>
      <p className="mt-2 text-sm text-neutral-600">{c.subtitle}</p>

      <div className="mt-6 grid gap-2">
        {listings.map((l) => (
          <Link
            key={l.id}
            href={`/listings/${l.id}`}
            className="rounded-xl border border-neutral-200 px-4 py-3 text-sm font-semibold hover:bg-neutral-50 transition"
          >
            {l.id}
          </Link>
        ))}
      </div>
    </Container>
  );
}
