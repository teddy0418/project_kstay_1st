"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export default function ListingGallery({
  title,
  images,
}: {
  title: string;
  images: string[];
}) {
  const [open, setOpen] = useState(false);
  const safe = images.slice(0, Math.max(5, images.length));

  return (
    <>
      <div className="relative grid gap-2 rounded-2xl overflow-hidden">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="relative aspect-[16/10] lg:aspect-[16/9] lg:row-span-2 lg:col-span-2 overflow-hidden"
        >
          <img
            src={safe[0]}
            alt={title}
            className="h-full w-full object-cover"
            loading="eager"
          />
        </button>

        <div className="hidden lg:grid lg:grid-cols-2 lg:grid-rows-2 gap-2">
          {safe.slice(1, 5).map((src) => (
            <button
              key={src}
              type="button"
              onClick={() => setOpen(true)}
              className="relative aspect-[4/3] overflow-hidden"
            >
              <img src={src} alt={title} className="h-full w-full object-cover" loading="lazy" />
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={() => setOpen(true)}
          className="absolute right-6 bottom-6 hidden lg:inline-flex rounded-xl bg-white px-4 py-2 text-sm font-semibold shadow-elevated"
        >
          Show all photos
        </button>
      </div>

      {open && (
        <div className="fixed inset-0 z-[90] bg-black/60">
          <div className="absolute inset-0 overflow-y-auto">
            <div className="mx-auto max-w-5xl px-4 py-6">
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

              <div className={cn("mt-5 grid gap-3", "sm:grid-cols-2 lg:grid-cols-3")}>
                {images.map((src) => (
                  <div
                    key={src}
                    className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-neutral-900"
                  >
                    <img
                      src={src}
                      alt={title}
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />
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
