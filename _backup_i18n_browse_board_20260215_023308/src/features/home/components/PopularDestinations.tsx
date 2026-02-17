"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import Container from "@/components/layout/Container";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useI18n } from "@/components/ui/LanguageProvider";

type Dest = { slug: string; label: string; value: string };

const DESTINATIONS: Dest[] = [
  { slug: "jeju", label: "Jeju", value: "Jeju" },
  { slug: "seoul", label: "Seoul", value: "Seoul" },
  { slug: "busan", label: "Busan", value: "Busan" },
  { slug: "gangneung", label: "Gangneung", value: "Gangneung" },
  { slug: "incheon", label: "Incheon", value: "Incheon" },
  { slug: "gyeongju", label: "Gyeongju", value: "Gyeongju" },
  { slug: "haeundae", label: "Haeundae", value: "Haeundae" },
  { slug: "gapyeong", label: "Gapyeong", value: "Gapyeong" },
  { slug: "yeosu", label: "Yeosu", value: "Yeosu" },
  { slug: "sokcho", label: "Sokcho", value: "Sokcho" },
];

function DestinationImage({ slug, label }: { slug: string; label: string }) {
  const svg = `/destinations/${slug}.svg`;
  const jpg = `/destinations/${slug}.jpg`;

  const [src, setSrc] = useState(svg);

  useEffect(() => {
    const probe = new Image();
    probe.src = jpg;
    probe.onload = () => setSrc(jpg);
  }, [jpg]);

  return (
    <img
      src={src}
      alt={label}
      className="h-full w-full object-cover"
      loading="lazy"
      draggable={false}
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
    <section className="mt-8">
      <Container>
        <div className="flex items-end justify-between gap-3">
          <div>
            <div className="text-lg font-semibold tracking-tight">{t("popular_destinations")}</div>
            <div className="mt-1 text-sm text-neutral-500">Swipe or use arrows to explore</div>
          </div>
        </div>

        <div className="relative mt-4">
          {canLeft && (
            <button
              type="button"
              onClick={() => scrollByDir(-1)}
              className="hidden md:inline-flex absolute -left-3 top-1/2 -translate-y-1/2 z-10 h-11 w-11 items-center justify-center rounded-full bg-white shadow-md hover:shadow-lg transition"
              aria-label="Scroll left"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
          )}

          {canRight && (
            <button
              type="button"
              onClick={() => scrollByDir(1)}
              className="hidden md:inline-flex absolute -right-3 top-1/2 -translate-y-1/2 z-10 h-11 w-11 items-center justify-center rounded-full bg-white shadow-md hover:shadow-lg transition"
              aria-label="Scroll right"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          )}

          <div
            ref={scrollerRef}
            className="no-scrollbar flex gap-4 overflow-x-auto scroll-smooth snap-x snap-mandatory pr-2"
          >
            {DESTINATIONS.map((d) => (
              <Link
                key={d.slug}
                href={`/browse?where=${encodeURIComponent(d.value)}`}
                className="snap-start shrink-0 w-[220px] rounded-2xl border border-neutral-200 bg-white shadow-sm hover:shadow-md transition overflow-hidden"
              >
                <div className="h-[130px] bg-neutral-100">
                  <DestinationImage slug={d.slug} label={d.label} />
                </div>
                <div className="p-3">
                  <div className="text-sm font-semibold">{d.label}</div>
                  <div className="text-xs text-neutral-500">Tap to explore</div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </Container>
    </section>
  );
}
