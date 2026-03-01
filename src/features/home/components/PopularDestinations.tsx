"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import Container from "@/components/layout/Container";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useI18n } from "@/components/ui/LanguageProvider";
import { DESTINATIONS, destinationImageCandidates } from "@/lib/destinations";
import { cn } from "@/lib/utils";

function DestinationImage({ slug, label }: { slug: string; label: string }) {
  const candidates = destinationImageCandidates(slug);
  const [idx, setIdx] = useState(0);

  const src = candidates[Math.min(idx, candidates.length - 1)];

  return (
    <Image
      src={src}
      alt={label}
      className="h-full w-full object-cover"
      width={800}
      height={480}
      sizes="220px"
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

    const onScroll = () => updateButtons();
    el.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", updateButtons);

    return () => {
      el.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", updateButtons);
    };
  }, []);

  const scrollByDir = (dir: -1 | 1) => {
    const el = scrollerRef.current;
    if (!el) return;
    const amount = Math.round(el.clientWidth * 0.85);
    el.scrollBy({ left: dir * amount, behavior: "smooth" });
  };

  return (
    <section className="mt-8 min-w-0 overflow-x-hidden">
      <Container>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="min-w-0">
            <div className="text-base font-semibold tracking-tight md:text-lg">{t("popular_destinations")}</div>
            <div className="mt-1 text-xs text-neutral-500 md:text-sm">{t("swipe_to_explore")}</div>
          </div>
        </div>

        <div className="relative mt-4">
          <button
            type="button"
            onClick={() => scrollByDir(-1)}
            disabled={!canLeft}
            className={cn(
              "inline-flex absolute left-2 md:-left-3 top-1/2 -translate-y-1/2 z-10 h-10 w-10 md:h-11 md:w-11 items-center justify-center rounded-full bg-white/95 shadow-md hover:shadow-lg transition",
              !canLeft && "opacity-30 cursor-default hover:shadow-md"
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
              "inline-flex absolute right-2 md:-right-3 top-1/2 -translate-y-1/2 z-10 h-10 w-10 md:h-11 md:w-11 items-center justify-center rounded-full bg-white/95 shadow-md hover:shadow-lg transition",
              !canRight && "opacity-30 cursor-default hover:shadow-md"
            )}
            aria-label="Scroll right"
          >
            <ChevronRight className="h-5 w-5" />
          </button>

          <div className="min-w-0 overflow-hidden">
          <div
            ref={scrollerRef}
            className="no-scrollbar flex gap-4 overflow-x-auto scroll-smooth snap-x snap-mandatory pr-2"
          >
            {DESTINATIONS.map((d) => (
              <Link
                key={d.slug}
                href={`/browse?where=${encodeURIComponent(d.value)}`}
                className="snap-start shrink-0 w-[200px] min-w-[180px] max-w-[45vw] sm:max-w-none sm:w-[220px] rounded-2xl border border-neutral-200 bg-white shadow-sm hover:shadow-md transition overflow-hidden"
              >
                <div className="h-[130px] bg-neutral-100">
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
