"use client";

import dynamic from "next/dynamic";
import type { Listing } from "@/types";

const LeafletMap = dynamic(() => import("./LeafletMap"), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full grid place-items-center text-sm text-neutral-600">
      Loading map…
    </div>
  ),
});

export default function MapPanel({
  items,
  hoveredId,
  onHoverChange,
}: {
  items: Listing[];
  hoveredId: string | null;
  onHoverChange?: (id: string | null) => void;
}) {
  return <LeafletMap items={items} hoveredId={hoveredId} onHoverChange={onHoverChange} />;
}
