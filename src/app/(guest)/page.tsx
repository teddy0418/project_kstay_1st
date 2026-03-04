import type { Metadata } from "next";
import Container from "@/components/layout/Container";
import PopularDestinations from "@/features/home/components/PopularDestinations";
import HorizontalTwoRowListings from "@/features/home/components/HorizontalTwoRowListings";
import { getPublicListingsBySection } from "@/lib/repositories/listings";
import { getServerLang } from "@/lib/i18n/server";

/** 승인된 숙소 목록이 바뀐 뒤에도 메인에 바로 반영되도록 캐시 사용 안 함 */
export const dynamic = "force-dynamic";

const SECTION_PAGE_SIZE = 8;

const METADATA_COPY: Record<"en" | "ko" | "ja" | "zh", { title: string; description: string }> = {
  en: {
    title: "KSTAY — Best value stays in Korea",
    description: "Book hanok, apartments, and curated stays across Korea. Transparent pricing, no hidden fees.",
  },
  ko: {
    title: "KSTAY — 한국 숙소, 최저가 예약",
    description: "한옥, 아파트, 큐레이션 숙소를 한국 전역에서. 숨은 수수료 없이 투명한 가격.",
  },
  ja: {
    title: "KSTAY — 韓国宿泊、最安値予約",
    description: "韓屋・アパート・厳選宿を韓国全域で。隠れた手数料なし、透明な料金。",
  },
  zh: {
    title: "KSTAY — 韩国住宿，低价预订",
    description: "韩屋、公寓与精选住宿，覆盖韩国。价格透明，无隐藏费用。",
  },
};

export async function generateMetadata(): Promise<Metadata> {
  const lang = await getServerLang();
  const m = METADATA_COPY[lang];
  return {
    title: m.title,
    description: m.description,
    openGraph: { title: m.title, description: m.description },
  };
}

const COPY = {
  en: {
    title: "Top Recommended Stays",
    popularHanok: "Popular Hanok",
    popularHanokSub: "Traditional Korean stays",
    thisWeekHot: "KSTAY Black",
    thisWeekHotSub: "Curated premium stays",
  },
  ko: {
    title: "추천 숙소",
    popularHanok: "인기 한옥",
    popularHanokSub: "전통 한옥 숙소",
    thisWeekHot: "KSTAY Black",
    thisWeekHotSub: "큐레이션 프리미엄",
  },
  ja: {
    title: "おすすめ宿泊先",
    popularHanok: "人気韓屋",
    popularHanokSub: "韓国伝統の宿",
    thisWeekHot: "KSTAY Black",
    thisWeekHotSub: "厳選プレミアム",
  },
  zh: {
    title: "推荐住宿",
    popularHanok: "人气韩屋",
    popularHanokSub: "传统韩屋住宿",
    thisWeekHot: "KSTAY Black",
    thisWeekHotSub: "精选高端",
  },
} as const;

const emptySection = { listings: [], nextCursor: null as string | null };

export default async function Page() {
  const lang = await getServerLang();
  const c = COPY[lang];

  const [recommendedPage, hanokPage, kstayBlackPage] = await Promise.all([
    getPublicListingsBySection("recommended", null, SECTION_PAGE_SIZE).catch((e) => {
      console.error("[main] recommended section failed", e);
      return emptySection;
    }),
    getPublicListingsBySection("hanok", null, SECTION_PAGE_SIZE).catch((e) => {
      console.error("[main] hanok section failed", e);
      return emptySection;
    }),
    getPublicListingsBySection("kstay-black", null, SECTION_PAGE_SIZE).catch((e) => {
      console.error("[main] kstay-black section failed", e);
      return emptySection;
    }),
  ]);

  return (
    <>
      <PopularDestinations />

      <Container className="py-10">
        <div className="flex flex-wrap items-end justify-between gap-4 border-l-4 border-neutral-900 pl-4">
          <div className="min-w-0">
            <h2 className="text-base font-semibold tracking-tight text-neutral-900 md:text-xl">{c.title}</h2>
          </div>
        </div>

        <HorizontalTwoRowListings
          section="recommended"
          listings={recommendedPage.listings}
          nextCursor={recommendedPage.nextCursor}
        />
        <HorizontalTwoRowListings
          section="hanok"
          title={c.popularHanok}
          subtitle={c.popularHanokSub}
          listings={hanokPage.listings}
          nextCursor={hanokPage.nextCursor}
        />
        <HorizontalTwoRowListings
          section="kstay-black"
          title={c.thisWeekHot}
          subtitle={c.thisWeekHotSub}
          listings={kstayBlackPage.listings}
          nextCursor={kstayBlackPage.nextCursor}
          showWhenEmpty
        />
      </Container>
    </>
  );
}
