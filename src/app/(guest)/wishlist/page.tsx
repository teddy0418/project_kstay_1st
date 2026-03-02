"use client";

import { useEffect, useState } from "react";
import Container from "@/components/layout/Container";
import { useWishlist } from "@/components/ui/WishlistProvider";
import { useI18n } from "@/components/ui/LanguageProvider";
import ListingCard from "@/features/listings/components/ListingCard";
import { apiClient } from "@/lib/api/client";
import type { Listing } from "@/types";

export default function WishlistPage() {
  const { t } = useI18n();
  const { ids, clear } = useWishlist();
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (ids.length === 0) {
      setListings([]);
      return;
    }
    setLoading(true);
    const query = "ids=" + encodeURIComponent(ids.join(","));
    apiClient
      .get<Listing[]>("/api/listings?" + query)
      .then((data) => setListings(Array.isArray(data) ? data : []))
      .catch(() => setListings([]))
      .finally(() => setLoading(false));
  }, [ids.join(",")]);

  return (
    <Container className="py-10">
      <h1 className="text-xl font-semibold tracking-tight md:text-2xl">{t("wishlist")}</h1>
      <p className="mt-2 text-xs text-neutral-500 md:text-sm">{t("wishlist_desc")}</p>

      <div className="mt-6">
        {ids.length === 0 ? (
          <div className="rounded-2xl border border-neutral-200 bg-white p-6 text-sm text-neutral-600 shadow-sm">
            {t("wishlist_empty")}
          </div>
        ) : (
          <div className="space-y-3">
            <button
              type="button"
              onClick={clear}
              className="rounded-xl border border-neutral-200 bg-white px-4 py-2 text-sm font-semibold hover:bg-neutral-50 transition"
            >
              {t("clear")}
            </button>

            {loading ? (
              <p className="py-8 text-sm text-neutral-500">{t("loading")}</p>
            ) : (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {listings.map((listing) => (
                  <ListingCard key={listing.id} listing={listing} />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </Container>
  );
}
