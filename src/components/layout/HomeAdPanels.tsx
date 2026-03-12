"use client";

import { useRef, useState, useEffect } from "react";
import Container from "@/components/layout/Container";
import { cn } from "@/lib/utils";
import { useI18n } from "@/components/ui/LanguageProvider";

const PANEL_COUNT = 3;
const BORDER_COLORS = ["#1B365D", "#D4AF37", "#A64439"] as const; // 왼쪽, 가운데, 오른쪽

export default function HomeAdPanels() {
  const { t } = useI18n();
  const panels = Array.from({ length: PANEL_COUNT }, (_, i) => i);
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(false);
  const [index, setIndex] = useState(0);

  const updateArrows = () => {
    const el = scrollerRef.current;
    if (!el) return;
    const left = el.scrollLeft;
    const max = el.scrollWidth - el.clientWidth;
    setCanLeft(left > 2);
    setCanRight(left < max - 2);
    const w = el.clientWidth;
    const i = Math.round(left / w);
    setIndex(Math.min(i, panels.length - 1));
  };

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const isMobile = window.innerWidth < 768;
    if (isMobile) {
      const w = el.clientWidth;
      el.scrollLeft = w;
      setIndex(1);
      setCanLeft(true);
      setCanRight(true);
    }
    updateArrows();
    el.addEventListener("scroll", updateArrows, { passive: true });
    window.addEventListener("resize", updateArrows);
    return () => {
      el.removeEventListener("scroll", updateArrows);
      window.removeEventListener("resize", updateArrows);
    };
  }, []);

  const scrollTo = (i: number) => {
    const el = scrollerRef.current;
    if (!el) return;
    const w = el.clientWidth;
    el.scrollTo({ left: i * w, behavior: "smooth" });
  };

  return (
    <section className="bg-transparent">
      <Container className="py-1.5 sm:py-2">
        {/* 데스크톱: 3열 그리드 */}
        <div className="hidden md:grid md:grid-cols-3 gap-2">
          {panels.map((i) => (
            <div
              key={i}
              className="rounded-lg p-2 min-h-[48px] bg-transparent"
            >
              {i === 0 && (
                <>
                  <p className="text-xs sm:text-sm font-bold text-white leading-tight">{t("ad_q0")}</p>
                  <p className="mt-0.5 text-[11px] sm:text-xs text-white/80 leading-tight">
                    <span>{t("ad_a1_0")}</span>
                    <span className="block">{t("ad_a2_0")}</span>
                  </p>
                </>
              )}
              {i === 1 && (
                <>
                  <p className="text-xs sm:text-sm font-bold text-white leading-tight">{t("ad_q1")}</p>
                  <p className="mt-0.5 text-[11px] sm:text-xs text-white/80 leading-tight">
                    <span>{t("ad_a1_1")}</span>
                    <span className="block">{t("ad_a2_1")}</span>
                  </p>
                </>
              )}
              {i === 2 && (
                <>
                  <p className="text-xs sm:text-sm font-bold text-white leading-tight">{t("ad_q2")}</p>
                  <p className="mt-0.5 text-[11px] sm:text-xs text-white/80 leading-tight">
                    <span>{t("ad_a1_2")}</span>
                    {t("ad_a2_2") ? <span className="block">{t("ad_a2_2")}</span> : null}
                  </p>
                </>
              )}
            </div>
          ))}
        </div>

        {/* 모바일: 1개씩 스와이프 (화살표 없이 스와이프 + 도트만) */}
        <div className="md:hidden">
          <div
            ref={scrollerRef}
            className="overflow-x-auto snap-x snap-mandatory scroll-smooth no-scrollbar flex gap-2"
            style={{ scrollSnapType: "x mandatory" }}
          >
            {panels.map((i) => (
              <div
                key={i}
                className="shrink-0 w-full min-w-full rounded-lg p-2 min-h-[52px] bg-transparent snap-start snap-always"
                style={{ scrollSnapAlign: "start" }}
              >
                {i === 0 && (
                  <>
                    <p className="text-xs sm:text-sm font-bold text-white leading-tight">{t("ad_q0")}</p>
                    <p className="mt-0.5 text-[11px] sm:text-xs text-white/80 leading-tight">
                      <span>{t("ad_a1_0")}</span>
                      <span className="block">{t("ad_a2_0")}</span>
                    </p>
                  </>
                )}
                {i === 1 && (
                  <>
                    <p className="text-xs sm:text-sm font-bold text-white leading-tight">{t("ad_q1")}</p>
                    <p className="mt-0.5 text-[11px] sm:text-xs text-white/80 leading-tight">
                      <span>{t("ad_a1_1")}</span>
                      <span className="block">{t("ad_a2_1")}</span>
                    </p>
                  </>
                )}
                {i === 2 && (
                  <>
                    <p className="text-xs sm:text-sm font-bold text-white leading-tight">{t("ad_q2")}</p>
                    <p className="mt-0.5 text-[11px] sm:text-xs text-white/80 leading-tight">
                      <span>{t("ad_a1_2")}</span>
                      {t("ad_a2_2") ? <span className="block">{t("ad_a2_2")}</span> : null}
                    </p>
                  </>
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-center gap-1.5 mt-1.5">
            {panels.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => scrollTo(i)}
                className={cn(
                  "h-1 rounded-full transition-all",
                  i === index ? "w-4 bg-[#E73587]" : "w-1 bg-neutral-300"
                )}
                aria-label={`Panel ${i + 1}`}
              />
            ))}
          </div>
        </div>
      </Container>
    </section>
  );
}
