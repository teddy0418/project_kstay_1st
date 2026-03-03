"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import Container from "@/components/layout/Container";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useI18n } from "@/components/ui/LanguageProvider";
import { DESTINATIONS, destinationImageCandidates } from "@/lib/destinations";
import { cn } from "@/lib/utils";

function DestinationImage({ slug, label, sizes }: { slug: string; label: string; sizes?: string }) {
  const candidates = destinationImageCandidates(slug);
  const [idx, setIdx] = useState(0);

  const src = candidates[Math.min(idx, candidates.length - 1)];

  return (
    <Image
      src={src}
      alt={label}
      className="h-full w-full object-cover"
      width={800}
      height={800}
      sizes={sizes ?? "220px"}
      draggable={false}
      onError={() => setIdx((v) => v + 1)}
    />
  );
}

export default function PopularDestinations() {
  const { t } = useI18n();
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(true);

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
    el.addEventListener("scroll", updateButtons, { passive: true });
    window.addEventListener("resize", updateButtons);
    return () => {
      el.removeEventListener("scroll", updateButtons);
      window.removeEventListener("resize", updateButtons);
    };
  }, []);

  const scrollByDir = (dir: -1 | 1) => {
    const el = scrollerRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * Math.round(el.clientWidth * 0.85), behavior: "smooth" });
  };

  return (
    <section className="mt-8 min-w-0 overflow-x-hidden">
      <Container>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="min-w-0">
            <div className="text-base font-semibold tracking-tight sm:text-lg">{t("popular_destinations")}</div>
            <div className="mt-1 hidden text-xs text-neutral-500 sm:block sm:text-sm">{t("swipe_to_explore")}</div>
          </div>
        </div>

        {/* 모바일 전용: 2x5 그리드, 정사각형 이미지만 네모 칸 · 이름은 밖에 (검색바와 동일 sm 640px) */}
        <div className="mt-4 grid grid-cols-5 gap-2 sm:hidden">
          {DESTINATIONS.map((d) => (
            <Link
              key={d.slug}
              href={`/browse?where=${encodeURIComponent(d.value)}`}
              className="flex flex-col items-center gap-1.5 active:opacity-90"
            >
              <div className="aspect-square w-full overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm">
                <DestinationImage slug={d.slug} label={d.label} sizes="20vw" />
              </div>
              <span className="text-center text-xs font-medium text-neutral-800">{d.label}</span>
            </Link>
          ))}
        </div>

        {/* sm 이상: 가로 스크롤 카드 (검색바와 동일 sm 640px) */}
        <div className="relative mt-4 hidden sm:block">
          <button
            type="button"
            onClick={() => scrollByDir(-1)}
            disabled={!canLeft}
            className={cn(
              "absolute left-2 sm:-left-3 top-1/2 -translate-y-1/2 z-10 h-10 w-10 sm:h-11 sm:w-11 inline-flex items-center justify-center rounded-full bg-white/95 shadow-md hover:shadow-lg transition",
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
              "absolute right-2 sm:-right-3 top-1/2 -translate-y-1/2 z-10 h-10 w-10 sm:h-11 sm:w-11 inline-flex items-center justify-center rounded-full bg-white/95 shadow-md hover:shadow-lg transition",
              !canRight && "opacity-30 cursor-default"
            )}
            aria-label="Scroll right"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
          <div className="min-w-0 overflow-hidden">
            <div
              ref={scrollerRef}
              className="no-scrollbar flex gap-4 overflow-x-auto pr-2 scroll-smooth snap-x snap-mandatory"
            >
              {DESTINATIONS.map((d) => (
                <Link
                  key={d.slug}
                  href={`/browse?where=${encodeURIComponent(d.value)}`}
                  className="shrink-0 snap-start overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm transition hover:shadow-md w-[200px] min-w-[180px] sm:w-[220px]"
                >
                  <div className="h-[130px] overflow-hidden rounded-t-2xl bg-neutral-100">
                    <DestinationImage slug={d.slug} label={d.label} />
                  </div>
                  <div className="p-3">
                    <div className="text-sm font-semibold">{d.label}</div>
                    <div className="text-xs text-neutral-500">{t("tap_to_explore")}</div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
