"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { X } from "lucide-react";
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
              onClick={() => setOpen(true)}
              className="h-[320px] sm:h-[420px] lg:h-[520px] lg:col-span-2 lg:row-span-2"
            />

            {/* right top */}
            {a && (
              <Tile
                src={a}
                alt={title}
                onClick={() => setOpen(true)}
                className="hidden lg:block lg:col-start-3 lg:row-start-1 lg:h-[254px]"
              />
            )}
            {b && (
              <Tile
                src={b}
                alt={title}
                onClick={() => setOpen(true)}
                className="hidden lg:block lg:col-start-4 lg:row-start-1 lg:h-[254px]"
              />
            )}

            {/* right bottom */}
            {c && (
              <Tile
                src={c}
                alt={title}
                onClick={() => setOpen(true)}
                className="hidden lg:block lg:col-start-3 lg:row-start-2 lg:h-[254px]"
              />
            )}
            {d && (
              <Tile
                src={d}
                alt={title}
                onClick={() => setOpen(true)}
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
                <Tile src={a} alt={title} onClick={() => setOpen(true)} className="h-[140px] sm:h-[180px]" />
              )}
              {b && (
                <Tile
                  src={b}
                  alt={title}
                  onClick={() => setOpen(true)}
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
          onClick={() => setOpen(true)}
          className="absolute right-6 bottom-6 hidden lg:inline-flex rounded-xl bg-white px-4 py-2 text-sm font-semibold shadow-md hover:shadow-lg transition"
        >
          Show all photos
        </button>
      </div>

      {/* Modal */}
      {open && (
        <div className="fixed inset-0 z-[90] bg-black/60">
          <div className="absolute inset-0 overflow-y-auto">
            <div className="mx-auto max-w-6xl px-4 py-6">
              <div className="flex items-center justify-between text-white">
                <div className="text-sm font-semibold">Photos</div>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full hover:bg-white/10"
                  aria-label="Close"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {safe.map((src) => (
                  <div key={src} className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-neutral-900">
                    <Image src={src} alt={title} className="h-full w-full object-cover" fill sizes="33vw" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
