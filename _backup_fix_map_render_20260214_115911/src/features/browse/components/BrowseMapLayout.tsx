"use client";

import { useState } from "react";
import type { Listing } from "@/types";
import ListingCard from "@/features/listings/components/ListingCard";
import MapPanel from "@/features/map/components/MapPanel";

export default function BrowseMapLayout({ items }: { items: Listing[] }) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_520px]">
      {/* Mobile map (top) */}
      <div className="lg:hidden rounded-2xl overflow-hidden border border-neutral-200 h-[360px]">
        <MapPanel items={items} hoveredId={hoveredId} onHoverChange={setHoveredId} />
      </div>

      {/* List */}
      <div className="min-w-0">
        <div className="grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
          {items.map((l) => (
            <ListingCard
              key={l.id}
              listing={l}
              active={hoveredId === l.id}
              onHoverChange={setHoveredId}
            />
          ))}
        </div>
      </div>

      {/* Desktop map (right sticky) */}
      <div className="hidden lg:block">
        <div className="sticky top-[132px] h-[calc(100vh-132px-24px)] rounded-2xl overflow-hidden border border-neutral-200">
          <MapPanel items={items} hoveredId={hoveredId} onHoverChange={setHoveredId} />
        </div>
      </div>
    </div>
  );
}
