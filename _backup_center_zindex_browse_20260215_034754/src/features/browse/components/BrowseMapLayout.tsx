"use client";

import { useEffect, useMemo, useState } from "react";
import type { Listing } from "@/types";
import ListingCard from "@/features/listings/components/ListingCard";
import MapPanel from "@/features/map/components/MapPanel";
import ErrorBoundary from "@/components/ui/ErrorBoundary";
import type { ViewBounds } from "@/features/map/components/LeafletMap";

function inBounds(l: Listing, b: ViewBounds) {
  return l.lat >= b.south && l.lat <= b.north && l.lng >= b.west && l.lng <= b.east;
}

function MapOverlay({
  showSearchArea,
  pendingBounds,
  areaBounds,
  onApplyAreaSearch,
  onClearAreaSearch,
}: {
  showSearchArea: boolean;
  pendingBounds: ViewBounds | null;
  areaBounds: ViewBounds | null;
  onApplyAreaSearch: () => void;
  onClearAreaSearch: () => void;
}) {
  return (
    <>
      {showSearchArea && pendingBounds && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[500]">
          <button
            type="button"
            onClick={onApplyAreaSearch}
            className="rounded-full bg-white px-4 py-2 text-sm font-semibold shadow-elevated border border-neutral-200 hover:bg-neutral-50"
          >
            Search this area
          </button>
        </div>
      )}

      {areaBounds && (
        <div className="absolute bottom-4 left-4 z-[500]">
          <button
            type="button"
            onClick={onClearAreaSearch}
            className="rounded-full bg-white px-4 py-2 text-xs font-semibold shadow-soft border border-neutral-200 hover:bg-neutral-50"
          >
            Clear area filter
          </button>
        </div>
      )}
    </>
  );
}

export default function BrowseMapLayout({ items }: { items: Listing[] }) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const [pendingBounds, setPendingBounds] = useState<ViewBounds | null>(null);
  const [areaBounds, setAreaBounds] = useState<ViewBounds | null>(null);
  const [showSearchArea, setShowSearchArea] = useState(false);

  const displayed = useMemo(() => {
    if (!areaBounds) return items;
    return items.filter((l) => inBounds(l, areaBounds));
  }, [items, areaBounds]);

  useEffect(() => {
    if (!hoveredId) return;
    if (!displayed.some((x) => x.id === hoveredId)) {
      queueMicrotask(() => setHoveredId(null));
    }
  }, [displayed, hoveredId]);

  const onMarkerClick = (id: string) => {
    setHoveredId(id);
    const el = document.getElementById(`card-${id}`);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  const applyAreaSearch = () => {
    if (!pendingBounds) return;
    setAreaBounds(pendingBounds);
    setShowSearchArea(false);
  };

  const clearAreaSearch = () => {
    setAreaBounds(null);
    setShowSearchArea(false);
  };

  const mapProps = {
    items: displayed,
    hoveredId,
    onHoverChange: setHoveredId,
    onMarkerClick,
    onBoundsChange: (b: ViewBounds) => setPendingBounds(b),
    onUserMoved: () => setShowSearchArea(true),
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_520px]">
      {/* Mobile map (top) */}
      <div className="lg:hidden relative rounded-2xl overflow-hidden border border-neutral-200 h-[360px] bg-neutral-100">
        <MapOverlay
          showSearchArea={showSearchArea}
          pendingBounds={pendingBounds}
          areaBounds={areaBounds}
          onApplyAreaSearch={applyAreaSearch}
          onClearAreaSearch={clearAreaSearch}
        />
        <ErrorBoundary
          fallback={
            <div className="h-full w-full grid place-items-center text-sm text-neutral-600">
              Map failed to load. (Check browser console)
            </div>
          }
        >
          <MapPanel {...mapProps} />
        </ErrorBoundary>
      </div>

      {/* List */}
      <div className="min-w-0">
        {displayed.length === 0 ? (
          <div className="rounded-2xl border border-neutral-200 p-10 text-center">
            <div className="text-lg font-semibold">No stays in this area</div>
            <p className="mt-2 text-sm text-neutral-600">
              Move the map and try &quot;Search this area&quot;, or clear the area filter.
            </p>
          </div>
        ) : (
          <div className="grid gap-x-6 gap-y-10 sm:grid-cols-2 xl:grid-cols-2">
            {displayed.map((l) => (
              <ListingCard
                key={l.id}
                listing={l}
                active={hoveredId === l.id}
                onHoverChange={setHoveredId}
              />
            ))}
          </div>
        )}
      </div>

      {/* Desktop map (right sticky) */}
      <div className="hidden lg:block">
        <div className="relative sticky top-[132px] h-[calc(100vh-132px-24px)] rounded-2xl overflow-hidden border border-neutral-200 bg-neutral-100">
          <MapOverlay
            showSearchArea={showSearchArea}
            pendingBounds={pendingBounds}
            areaBounds={areaBounds}
            onApplyAreaSearch={applyAreaSearch}
            onClearAreaSearch={clearAreaSearch}
          />
          <ErrorBoundary
            fallback={
              <div className="h-full w-full grid place-items-center text-sm text-neutral-600">
                Map failed to load. (Check browser console)
              </div>
            }
          >
            <MapPanel {...mapProps} />
          </ErrorBoundary>
        </div>
      </div>
    </div>
  );
}
