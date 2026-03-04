"use client";

import { useCallback, useEffect, useState } from "react";
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
  const [error, setError] = useState(false);

  const fetchListings = useCallback(() => {
    if (ids.length === 0) {
      setListings([]);
      setError(false);
      return;
    }
    setLoading(true);
    setError(false);
    const query = "ids=" + encodeURIComponent(ids.join(","));
    apiClient
      .get<Listing[]>("/api/listings?" + query)
      .then((data) => setListings(Array.isArray(data) ? data : []))
      .catch(() => {
        setListings([]);
        setError(true);
      })
      .finally(() => setLoading(false));
  }, [ids.join(",")]);

  useEffect(() => {
    fetchListings();
  }, [fetchListings]);

  const handleClear = () => {
    if (window.confirm(t("wishlist_clear_confirm"))) clear();
  };

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
              onClick={handleClear}
              className="rounded-xl border border-neutral-200 bg-white px-4 py-2 text-sm font-semibold hover:bg-neutral-50 transition"
            >
              {t("clear")}
            </button>

            {loading ? (
              <p className="py-8 text-sm text-neutral-500">{t("loading")}</p>
            ) : error ? (
              <div className="rounded-2xl border border-neutral-200 bg-neutral-50 px-6 py-8 text-center text-sm text-neutral-600">
                <p>{t("wishlist_list_error")}</p>
                <button
                  type="button"
                  onClick={() => fetchListings()}
                  className="mt-4 rounded-xl bg-neutral-900 px-5 py-2.5 text-sm font-semibold text-white hover:opacity-90 transition"
                >
                  {t("wishlist_retry")}
                </button>
              </div>
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
