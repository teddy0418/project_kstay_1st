import Container from "@/components/layout/Container";
import PopularDestinations from "@/features/home/components/PopularDestinations";
import ListingCard from "@/features/listings/components/ListingCard";
import { getPublicListings } from "@/lib/repositories/listings";
import { getServerLang } from "@/lib/i18n/server";

const COPY = {
  en: {
    title: "Top Recommended Stays",
    subtitle: "KSTAY offers the most competitive rates by minimizing intermediary fees compared to other platforms.",
  },
  ko: {
    title: "추천 숙소",
    subtitle: "KSTAY는 중개 수수료를 최소화하여 다른 플랫폼 대비 더 경쟁력 있는 요금을 제공합니다.",
  },
  ja: {
    title: "おすすめ宿泊先",
    subtitle: "KSTAYは仲介手数料を最小化し、他プラットフォームより競争力のある料金を提供します。",
  },
  zh: {
    title: "推荐住宿",
    subtitle: "KSTAY 通过尽量减少中间费用，提供更有竞争力的价格。",
  },
} as const;

export default async function Page() {
  const lang = await getServerLang();
  const c = COPY[lang];
  const listings = await getPublicListings();
  return (
    <>
      <PopularDestinations />

      <Container className="py-10">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold tracking-tight">{c.title}</h2>
            <p className="mt-1 text-sm text-neutral-600">{c.subtitle}</p>
          </div>
        </div>

        <div className="mt-6 grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {listings.slice(0, 8).map((l) => (
            <ListingCard key={l.id} listing={l} />
          ))}
        </div>
      </Container>
    </>
  );
}
