"use client";

import Link from "next/link";
import Container from "@/components/layout/Container";
import { useWishlist } from "@/components/ui/WishlistProvider";
import { useI18n } from "@/components/ui/LanguageProvider";

export default function WishlistPage() {
  const { t } = useI18n();
  const { ids, clear } = useWishlist();

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

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
              {ids.map((listingId) => (
                <Link
                  key={listingId}
                  href={`/listings/${listingId}`}
                  className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm hover:shadow-md transition"
                >
                  <div className="text-sm font-semibold">Listing #{listingId}</div>
                  <div className="mt-1 text-xs text-neutral-500">{t("tap_to_open")}</div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </Container>
  );
}
