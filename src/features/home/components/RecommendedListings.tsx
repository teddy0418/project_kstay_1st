"use client";

import { useState } from "react";
import ListingCard from "@/features/listings/components/ListingCard";
import { useI18n } from "@/components/ui/LanguageProvider";
import type { Listing } from "@/types";

const INITIAL_COUNT = 9;
const LOAD_MORE_STEP = 9;

export default function RecommendedListings({ listings }: { listings: Listing[] }) {
  const { t } = useI18n();
  const [visibleCount, setVisibleCount] = useState(INITIAL_COUNT);
  const visible = listings.slice(0, visibleCount);
  const hasMore = visibleCount < listings.length;

  const loadMore = () => {
    setVisibleCount((prev) => Math.min(prev + LOAD_MORE_STEP, listings.length));
  };

  return (
    <>
      <div className="mt-6 grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {visible.map((l) => (
          <ListingCard key={l.id} listing={l} />
        ))}
      </div>
      {hasMore && (
        <div className="mt-10 flex justify-center">
          <button
            type="button"
            onClick={loadMore}
            className="inline-flex items-center justify-center rounded-xl bg-neutral-900 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:opacity-95 active:scale-[0.98]"
          >
            {t("load_more")}
          </button>
        </div>
      )}
    </>
  );
}
