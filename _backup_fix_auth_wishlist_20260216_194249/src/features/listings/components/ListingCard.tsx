"use client";

import Link from "next/link";
import { Heart, Star } from "lucide-react";
import type { Listing } from "@/types";
import { totalGuestPriceKRW } from "@/lib/policy";
import { formatDualPriceFromKRW } from "@/lib/currency";
import { useCurrency } from "@/components/ui/CurrencyProvider";
import { useToast } from "@/components/ui/ToastProvider";
import { useWishlist } from "@/components/ui/useWishlist";
import { useAuth } from "@/components/ui/AuthProvider";
import { useI18n } from "@/components/ui/LanguageProvider";
import { useAuthModal } from "@/components/ui/auth/AuthModalProvider";

export default function ListingCard({
  listing,
  active,
  onHoverChange,
}: {
  listing: Listing;
  active?: boolean;
  onHoverChange?: (id: string | null) => void;
}) {
  void active;
  const { currency } = useCurrency();
  const { toast } = useToast();
  const { t } = useI18n();
  const { has, toggle } = useWishlist();
  const { isAuthed } = useAuth();
  const { openAuth } = useAuthModal();

  const guestAllInKRW = totalGuestPriceKRW(listing.pricePerNightKRW);
  const dual = formatDualPriceFromKRW(guestAllInKRW, currency);

  const rawId: unknown = (listing as { id?: unknown; listingId?: unknown; slug?: unknown }).id ?? (listing as { listingId?: unknown }).listingId ?? (listing as { slug?: unknown }).slug;
  const listingId = rawId != null ? encodeURIComponent(String(rawId)) : "";
  const href = listingId ? `/listings/${listingId}` : "/listings";

  const saved = listingId ? has(String(rawId)) : false;

  return (
    <div
      className="group"
      id={listingId ? `card-${String(rawId)}` : undefined}
      onMouseEnter={() => onHoverChange?.(listingId ? String(rawId) : null)}
      onMouseLeave={() => onHoverChange?.(null)}
    >
      <div className="relative">
        <Link href={href} className="block">
          <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-neutral-100 shadow-soft transition group-hover:shadow-elevated">
            <img
              src={listing.images[0]}
              alt={listing.title}
              className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
              loading="lazy"
            />
          </div>
        </Link>

        <button
          type="button"
          onClick={() => {
            if (!listingId) return;
            if (!isAuthed) {
              openAuth({ next: typeof window !== "undefined" ? window.location.pathname + window.location.search : "/", role: "guest" });
              return;
            }
            const res = toggle(String(rawId));
            if (!res.ok && res.reason === "LOGIN_REQUIRED") {
              toast(t("login_required_wishlist"));
              return;
            }
            toast(saved ? t("remove_wishlist") : t("add_wishlist"));
          }}
          className="group/heart absolute right-3 top-3 z-10 inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/90 shadow-soft transition active:scale-95"
          aria-label="Save to wishlist"
        >
          {!saved && (
            <>
              <Heart className="h-5 w-5 text-neutral-800 opacity-100 transition-opacity duration-150 group-hover/heart:opacity-0" />
              <Heart className="absolute h-5 w-5 text-rose-500 opacity-0 transition-opacity duration-150 group-hover/heart:opacity-100" fill="currentColor" />
            </>
          )}
          {saved && <Heart className="h-5 w-5 text-rose-500" fill="currentColor" />}
        </button>
      </div>

      <Link href={href} className="block">
        <div className="mt-3 flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="font-medium text-neutral-900 truncate">{listing.location}</div>
            <div className="mt-0.5 text-sm text-neutral-600 truncate">{listing.title}</div>

            <div className="mt-1 text-sm text-neutral-900">
              <span className="font-semibold">{dual.main}</span> / night{" "}
              <span className="text-xs text-neutral-500">(≈ {dual.approxKRW})</span>
            </div>
            <div className="mt-0.5 text-xs text-neutral-500">{t("tax_service_included")}</div>
          </div>

          <div className="flex shrink-0 items-center gap-1 text-sm text-neutral-900">
            <Star className="h-4 w-4" />
            <span>{listing.rating.toFixed(2)}</span>
          </div>
        </div>
      </Link>
    </div>
  );
}
