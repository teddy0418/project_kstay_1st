"use client";

import { useState } from "react";
import { Copy, MapPin, X } from "lucide-react";
import { useToast } from "@/components/ui/ToastProvider";

export default function MapModal({
  address,
  lat,
  lng,
}: {
  address: string;
  lat: number;
  lng: number;
}) {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(address);
      toast("Address copied");
    } catch {
      toast("Copy failed");
    }
  };

  const src = `https://www.openstreetmap.org/export/embed.html?bbox=${lng - 0.02}%2C${lat - 0.02}%2C${lng + 0.02}%2C${lat + 0.02}&layer=mapnik&marker=${lat}%2C${lng}`;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-full border border-neutral-200 px-4 py-2 text-sm hover:bg-neutral-50"
      >
        <MapPin className="h-4 w-4" />
        View map
      </button>

      {open && (
        <div className="fixed inset-0 z-[90] bg-black/45">
          <div className="absolute left-1/2 top-1/2 w-[min(900px,calc(100%-24px))] -translate-x-1/2 -translate-y-1/2 rounded-3xl bg-white shadow-elevated overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200">
              <div className="text-sm font-semibold">Location</div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full hover:bg-neutral-100"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="px-6 py-4">
              <div className="flex items-start justify-between gap-3">
                <div className="text-sm text-neutral-700">{address}</div>
                <button
                  type="button"
                  onClick={copy}
                  className="inline-flex items-center gap-2 rounded-full border border-neutral-200 px-3 py-2 text-sm hover:bg-neutral-50"
                >
                  <Copy className="h-4 w-4" />
                  Copy
                </button>
              </div>

              <div className="mt-4 overflow-hidden rounded-2xl border border-neutral-200 bg-neutral-100 h-[420px]">
                <iframe title="map" src={src} className="h-full w-full" />
              </div>

              <p className="mt-3 text-xs text-neutral-500">
                MVP note: Google Maps popup can replace this later (API key).
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
