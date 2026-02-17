"use client";

import { useSearchParams } from "next/navigation";
import type { Listing } from "@/types";
import BrowseMapLayout from "@/features/browse/components/BrowseMapLayout";
import ListingCard from "@/features/listings/components/ListingCard";

export default function ResultsView({ items }: { items: Listing[] }) {
  const sp = useSearchParams();
  const view = sp.get("view"); // "map" or null

  if (view === "map") {
    return <BrowseMapLayout items={items} />;
  }

  return (
    <div className="grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
      {items.map((l) => (
        <ListingCard key={l.id} listing={l} />
      ))}
    </div>
  );
}
