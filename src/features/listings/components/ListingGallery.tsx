"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

function Tile({
  src,
  alt,
  onClick,
  className,
  overlay,
}: {
  src: string;
  alt: string;
  onClick: () => void;
  className: string;
  overlay?: React.ReactNode;
}) {
  return (
    <button type="button" onClick={onClick} className={cn("relative overflow-hidden rounded-xl", className)}>
      <Image src={src} alt={alt} className="absolute inset-0 h-full w-full object-cover" fill sizes="50vw" />
      {overlay}
    </button>
  );
}

export default function ListingGallery({
  title,
  images,
}: {
  title: string;
  images: string[];
}) {
  const [open, setOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);

  const safe = useMemo(() => images.filter(Boolean), [images]);
  const main = safe[0];
  const a = safe[1];
  const b = safe[2];
  const c = safe[3];
  const d = safe[4];

  const extraCount = Math.max(0, safe.length - 5);

  if (!main) {
    return (
      <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-10 text-sm text-neutral-500">
        No photos available.
      </div>
    );
  }

  const goPrev = () => {
    if (safe.length === 0) return;
    setCurrentIndex((prev) => (prev - 1 + safe.length) % safe.length);
  };

  const goNext = () => {
    if (safe.length === 0) return;
    setCurrentIndex((prev) => (prev + 1) % safe.length);
  };

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    setTouchStartX(e.touches[0].clientX);
  };

  const handleTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
    if (touchStartX == null) return;
    const endX = e.changedTouches[0].clientX;
    const deltaX = endX - touchStartX;
    const threshold = 40;
    if (deltaX > threshold) {
      goPrev();
    } else if (deltaX < -threshold) {
      goNext();
    }
    setTouchStartX(null);
  };

  return (
    <>
      {/* ✅ 여기어때 느낌: 큰 이미지(좌) + 4장(우 2x2) */}
      <div className="relative rounded-2xl overflow-hidden">
        <div className="bg-white p-2">
          <div className="grid gap-2 lg:grid-cols-4 lg:grid-rows-2">
            {/* main */}
            <Tile
              src={main}
              alt={title}
              onClick={() => {
                setCurrentIndex(0);
                setOpen(true);
              }}
              className="h-[320px] sm:h-[420px] lg:h-[520px] lg:col-span-2 lg:row-span-2"
            />

            {/* right top */}
            {a && (
              <Tile
                src={a}
                alt={title}
                onClick={() => {
                  setCurrentIndex(1);
                  setOpen(true);
                }}
                className="hidden lg:block lg:col-start-3 lg:row-start-1 lg:h-[254px]"
              />
            )}
            {b && (
              <Tile
                src={b}
                alt={title}
                onClick={() => {
                  setCurrentIndex(2);
                  setOpen(true);
                }}
                className="hidden lg:block lg:col-start-4 lg:row-start-1 lg:h-[254px]"
              />
            )}

            {/* right bottom */}
            {c && (
              <Tile
                src={c}
                alt={title}
                onClick={() => {
                  setCurrentIndex(3);
                  setOpen(true);
                }}
                className="hidden lg:block lg:col-start-3 lg:row-start-2 lg:h-[254px]"
              />
            )}
            {d && (
              <Tile
                src={d}
                alt={title}
                onClick={() => {
                  setCurrentIndex(4);
                  setOpen(true);
                }}
                className="hidden lg:block lg:col-start-4 lg:row-start-2 lg:h-[254px]"
                overlay={
                  extraCount > 0 ? (
                    <div className="absolute right-3 bottom-3 rounded-full bg-black/55 px-3 py-1 text-xs font-semibold text-white">
                      {extraCount}+ more
                    </div>
                  ) : null
                }
              />
            )}

            {/* Mobile/Tablet fallback: show 2 thumbnails below main */}
            <div className="grid grid-cols-2 gap-2 lg:hidden">
              {a && (
                <Tile
                  src={a}
                  alt={title}
                  onClick={() => {
                    setCurrentIndex(1);
                    setOpen(true);
                  }}
                  className="h-[140px] sm:h-[180px]"
                />
              )}
              {b && (
                <Tile
                  src={b}
                  alt={title}
                  onClick={() => {
                    setCurrentIndex(2);
                    setOpen(true);
                  }}
                  className="h-[140px] sm:h-[180px]"
                  overlay={
                    safe.length > 3 ? (
                      <div className="absolute right-3 bottom-3 rounded-full bg-black/55 px-3 py-1 text-xs font-semibold text-white">
                        Show all
                      </div>
                    ) : null
                  }
                />
              )}
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            setCurrentIndex(0);
            setOpen(true);
          }}
          className="absolute right-6 bottom-6 hidden lg:inline-flex rounded-xl bg-white px-4 py-2 text-sm font-semibold shadow-md hover:shadow-lg transition"
        >
          Show all photos
        </button>
      </div>

      {/* Modal */}
      {open && (
        <div className="fixed inset-0 z-[90] bg-black/60">
          <div className="absolute inset-0 overflow-y-auto">
            <div className="mx-auto flex min-h-screen max-w-6xl items-center px-4 py-6">
              {safe.length > 0 && (
                <div className="flex w-full flex-col items-center gap-4">
                  <div
                    className="relative w-full max-w-3xl aspect-[4/3] overflow-hidden rounded-2xl bg-neutral-900"
                    onTouchStart={handleTouchStart}
                    onTouchEnd={handleTouchEnd}
                  >
                    <Image
                      src={safe[currentIndex]}
                      alt={title}
                      className="h-full w-full object-cover"
                      fill
                      sizes="70vw"
                    />
                    {/* 상단 오버레이: 왼쪽에 Photos (2/5), 오른쪽에 닫기 버튼 */}
                    <div className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between px-3 py-3 sm:px-4">
                      <div className="pointer-events-auto rounded-full bg-black/65 px-3 py-1 text-xs font-semibold text-white sm:text-sm">
                        Photos ({currentIndex + 1} / {safe.length})
                      </div>
                      <button
                        type="button"
                        onClick={() => setOpen(false)}
                        className="pointer-events-auto inline-flex items-center gap-1.5 rounded-full bg-white/95 px-3 py-1 text-xs font-semibold text-neutral-900 shadow hover:bg-[#E73587] hover:text-white"
                        aria-label="Close"
                      >
                        <X className="h-4 w-4" />
                        <span className="hidden xs:inline">닫기</span>
                      </button>
                    </div>
                    {/* 좌우 화살표 (모바일에서는 탭/스와이프 둘 다 가능) */}
                    <button
                      type="button"
                      onClick={goPrev}
                      className="absolute left-2 top-1/2 -translate-y-1/2 inline-flex h-9 w-9 items-center justify-center rounded-full bg-black/40 text-white hover:bg-[#E73587] md:h-10 md:w-10"
                      aria-label="Previous photo"
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </button>
                    <button
                      type="button"
                      onClick={goNext}
                      className="absolute right-2 top-1/2 -translate-y-1/2 inline-flex h-9 w-9 items-center justify-center rounded-full bg-black/40 text-white hover:bg-[#E73587] md:h-10 md:w-10"
                      aria-label="Next photo"
                    >
                      <ChevronRight className="h-5 w-5" />
                    </button>
                  </div>
                  <div className="flex flex-wrap items-center justify-center gap-2">
                    {safe.map((_, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setCurrentIndex(i)}
                        className={cn(
                          "min-w-[32px] rounded-full px-2 py-1 text-xs font-semibold transition border border-transparent",
                          i === currentIndex
                            ? "bg-[#E73587] text-white border-[#E73587]"
                            : "bg-white/10 text-white hover:bg-[#E73587] hover:text-white hover:border-[#E73587]"
                        )}
                      >
                        {i + 1}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
