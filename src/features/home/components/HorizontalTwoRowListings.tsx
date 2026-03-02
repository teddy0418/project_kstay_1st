"use client";

import { useRef, useState, useEffect, Fragment, useCallback } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import ListingCard from "@/features/listings/components/ListingCard";
import { useI18n } from "@/components/ui/LanguageProvider";
import { cn } from "@/lib/utils";
import type { Listing } from "@/types";

const BATCH_SIZE = 10;
const CARDS_PER_ROW = 5;

export type SectionType = "recommended" | "hanok" | "kstay-black";

const SECTION_ACCENT: Record<
  SectionType,
  { border: string; title: string; subtitle: string }
> = {
  recommended: {
    border: "border-l-blue-500",
    title: "text-blue-800",
    subtitle: "text-neutral-600",
  },
  hanok: {
    border: "border-l-amber-500",
    title: "text-amber-900",
    subtitle: "text-neutral-900",
  },
  "kstay-black": {
    border: "border-l-neutral-800",
    title: "text-neutral-900 font-bold",
    subtitle: "text-neutral-600",
  },
};

type Props = {
  /** 섹션 타입이 있으면 더보기 시 API로 10개씩 추가 로드 */
  section?: SectionType;
  /** 비우면 제목 없음 (추천 숙소 바로 아래 카드용) */
  title?: string;
  /** 섹션 제목 아래 서브 문구 (선택) */
  subtitle?: string;
  listings: Listing[];
  /** 첫 페이지 다음 커서 (section 있을 때만 사용) */
  nextCursor?: string | null;
  /** true면 목록이 없어도 섹션(제목+빈 상태 메시지) 표시 (예: KSTAY Black) */
  showWhenEmpty?: boolean;
};

export default function HorizontalTwoRowListings({
  section,
  title,
  subtitle,
  listings: initialListings,
  nextCursor: initialNextCursor,
  showWhenEmpty,
}: Props) {
  const { t } = useI18n();
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const [list, setList] = useState<Listing[]>(initialListings);
  const [cursor, setCursor] = useState<string | null>(initialNextCursor ?? null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [visibleCount, setVisibleCount] = useState(BATCH_SIZE);
  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(true);

  useEffect(() => {
    setList(initialListings);
    setCursor(initialNextCursor ?? null);
  }, [initialListings, initialNextCursor]);

  const usePagination = section != null;
  const visible = usePagination ? list : list.slice(0, visibleCount);
  const hasMore = usePagination ? cursor != null : visibleCount < list.length;

  const loadMore = useCallback(async () => {
    if (usePagination && cursor) {
      setLoadingMore(true);
      try {
        const params = new URLSearchParams({
          section,
          limit: String(BATCH_SIZE),
          cursor,
        });
        const res = await fetch(`/api/listings/section?${params}`);
        const data = await res.json();
        if (res.ok && data?.data) {
          const { listings: nextListings, nextCursor: next } = data.data;
          setList((prev) => [...prev, ...(nextListings ?? [])]);
          setCursor(next ?? null);
        }
      } finally {
        setLoadingMore(false);
      }
    } else if (!usePagination) {
      setVisibleCount((prev) => Math.min(prev + BATCH_SIZE, list.length));
    }
  }, [usePagination, cursor, section, list.length]);

  const isEmpty = list.length === 0;
  if (isEmpty && !showWhenEmpty) return null;
  const accent = section ? SECTION_ACCENT[section] : null;

  if (isEmpty && showWhenEmpty && title) {
    return (
      <section className="min-w-0 overflow-x-hidden mt-10">
        <div
          className={cn(
            "flex flex-wrap items-end justify-between gap-3 mb-4 pl-4",
            accent?.border && `border-l-4 ${accent.border}`
          )}
        >
          <div>
            <h2 className={cn("text-base font-semibold tracking-tight md:text-xl", accent?.title)}>
              {title}
            </h2>
            {subtitle && (
              <p className={cn("mt-0.5 text-xs md:text-sm", accent?.subtitle)}>{subtitle}</p>
            )}
          </div>
        </div>
        <div className="rounded-2xl border border-neutral-200 bg-neutral-50 px-6 py-8 text-center text-sm text-neutral-500">
          {t("kstay_black_empty")}
        </div>
      </section>
    );
  }

  const updateButtons = () => {
    const el = scrollerRef.current;
    if (!el) return;
    const left = el.scrollLeft;
    const max = el.scrollWidth - el.clientWidth;
    setCanLeft(left > 2);
    setCanRight(left < max - 2);
  };

  useEffect(() => {
    updateButtons();
    const el = scrollerRef.current;
    if (!el) return;
    const onScroll = () => updateButtons();
    el.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", updateButtons);
    return () => {
      el.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", updateButtons);
    };
  }, [visible.length]);

  const scrollByDir = (dir: -1 | 1) => {
    const el = scrollerRef.current;
    if (!el) return;
    const amount = Math.round(el.clientWidth * 0.7);
    el.scrollBy({ left: dir * amount, behavior: "smooth" });
  };

  const batches: Listing[][] = [];
  for (let i = 0; i < visible.length; i += BATCH_SIZE) {
    batches.push(visible.slice(i, i + BATCH_SIZE));
  }

  return (
    <section className={`min-w-0 overflow-x-hidden ${title ? "mt-10" : "mt-6"}`}>
      {title ? (
        <div
          className={cn(
            "flex flex-wrap items-end justify-between gap-3 mb-4 pl-4",
            accent?.border && `border-l-4 ${accent.border}`
          )}
        >
          <div>
            <h2 className={cn("text-base font-semibold tracking-tight md:text-xl", accent?.title)}>
              {title}
            </h2>
            {subtitle && (
              <p className={cn("mt-0.5 text-xs md:text-sm", accent?.subtitle)}>{subtitle}</p>
            )}
          </div>
        </div>
      ) : null}

      <div className={title ? "relative mt-4" : "relative"}>
        <button
          type="button"
          onClick={() => scrollByDir(-1)}
          disabled={!canLeft}
          className={cn(
            "absolute left-2 md:-left-3 top-1/2 -translate-y-1/2 z-10 h-10 w-10 md:h-11 md:w-11 inline-flex items-center justify-center rounded-full bg-white/95 shadow-md hover:shadow-lg transition",
            !canLeft && "opacity-30 cursor-default"
          )}
          aria-label="Scroll left"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <button
          type="button"
          onClick={() => scrollByDir(1)}
          disabled={!canRight}
          className={cn(
            "absolute right-2 md:-right-3 top-1/2 -translate-y-1/2 z-10 h-10 w-10 md:h-11 md:w-11 inline-flex items-center justify-center rounded-full bg-white/95 shadow-md hover:shadow-lg transition",
            !canRight && "opacity-30 cursor-default"
          )}
          aria-label="Scroll right"
        >
          <ChevronRight className="h-5 w-5" />
        </button>

        <div className="min-w-0 overflow-hidden">
          <div
            ref={scrollerRef}
            className="no-scrollbar overflow-x-auto scroll-smooth pb-2 flex gap-3 md:gap-4"
            style={{ minHeight: "420px" }}
          >
            {batches.map((batch, batchIdx) => (
              <Fragment key={batchIdx}>
                {Array.from({ length: CARDS_PER_ROW }, (_, colIdx) => (
                  <div
                    key={colIdx}
                    className="flex flex-col gap-3 shrink-0 w-[38vw] min-w-[130px] max-w-[155px] md:w-[260px] md:min-w-[240px] md:max-w-[280px]"
                  >
                    {batch[colIdx] && (
                      <div className="rounded-2xl overflow-hidden">
                        <ListingCard listing={batch[colIdx]} variant="compact" />
                      </div>
                    )}
                    {batch[colIdx + CARDS_PER_ROW] && (
                      <div className="rounded-2xl overflow-hidden">
                        <ListingCard listing={batch[colIdx + CARDS_PER_ROW]} variant="compact" />
                      </div>
                    )}
                  </div>
                ))}
                <div className="shrink-0 w-[120px] min-w-[100px] md:w-[160px] rounded-2xl border border-neutral-200 bg-neutral-50 flex flex-col items-center justify-center px-4 self-stretch">
                  {hasMore && batchIdx === batches.length - 1 ? (
                    <button
                      type="button"
                      onClick={() => void loadMore()}
                      disabled={loadingMore}
                      className="text-sm font-semibold text-neutral-700 hover:text-neutral-900 disabled:opacity-50"
                    >
                      {loadingMore ? "..." : `${t("load_more")} >`}
                    </button>
                  ) : (
                    <span className="text-sm text-neutral-500">{t("load_more")} &gt;</span>
                  )}
                </div>
              </Fragment>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
