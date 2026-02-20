"use client";

import dynamic from "next/dynamic";
import type { Listing } from "@/types";
import type { ViewBounds } from "./LeafletMap";

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
  selectedId,
  onHoverChange,
  onMarkerClick,
  onBoundsChange,
  onUserMoved,
}: {
  items: Listing[];
  hoveredId: string | null;
  selectedId?: string | null;
  onHoverChange?: (id: string | null) => void;
  onMarkerClick?: (id: string) => void;
  onBoundsChange?: (b: ViewBounds) => void;
  onUserMoved?: () => void;
}) {
  return (
    <LeafletMap
      items={items}
      hoveredId={hoveredId}
      selectedId={selectedId ?? null}
      onHoverChange={onHoverChange}
      onMarkerClick={onMarkerClick}
      onBoundsChange={onBoundsChange}
      onUserMoved={onUserMoved}
    />
  );
}
