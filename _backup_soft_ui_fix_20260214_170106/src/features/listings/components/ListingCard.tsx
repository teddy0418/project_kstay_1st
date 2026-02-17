"use client";

import Link from "next/link";
import Image from "next/image";
import { Heart, Star } from "lucide-react";
import type { Listing } from "@/types";
import { cn } from "@/lib/utils";
import { totalGuestPriceKRW } from "@/lib/policy";
import { formatDualPriceFromKRW } from "@/lib/currency";
import { useCurrency } from "@/components/ui/CurrencyProvider";
import { useToast } from "@/components/ui/ToastProvider";

export default function ListingCard({
  listing,
  active,
  onHoverChange,
}: {
  listing: Listing;
  active?: boolean;
  onHoverChange?: (id: string | null) => void;
}) {
  const { currency } = useCurrency();
  const { toast } = useToast();

  const isLoggedIn = false;

  const guestAllInKRW = totalGuestPriceKRW(listing.pricePerNightKRW);
  const dual = formatDualPriceFromKRW(guestAllInKRW, currency);

  return (
    <Link
      id={`card-${listing.id}`}
      href={`/listings/${listing.id}`}
      className={cn(
        "group block scroll-mt-[180px]",
        active && "outline outline-2 outline-brand/30 rounded-2xl outline-offset-2"
      )}
      onMouseEnter={() => onHoverChange?.(listing.id)}
      onMouseLeave={() => onHoverChange?.(null)}
    >
      <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-neutral-100">
        <Image
          src={listing.images[0]}
          alt={listing.title}
          fill
          className="object-cover transition duration-300 group-hover:scale-[1.03]"
          sizes="(min-width: 1280px) 320px, (min-width: 768px) 33vw, 100vw"
        />

        <div className="absolute left-3 top-3 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold shadow-soft">
          Best Value <span className="text-neutral-500">(0% Host Fee)</span>
        </div>

        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (!isLoggedIn) {
              toast("Log in to save stays (1-second login coming soon).");
              return;
            }
            toast("Saved to Wishlist (MVP placeholder).");
          }}
          className="absolute right-3 top-3 inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/90 shadow-soft active:scale-95 transition"
          aria-label="Save to wishlist"
        >
          <Heart className="h-5 w-5 text-neutral-800" />
        </button>
      </div>

      <div className="mt-3 flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="font-medium text-neutral-900 truncate">{listing.location}</div>
          <div className="mt-0.5 text-sm text-neutral-600 truncate">{listing.title}</div>

          <div className="mt-1 text-sm text-neutral-900">
            <span className="font-semibold">{dual.main}</span> / night{" "}
            <span className="text-xs text-neutral-500">(≈ {dual.approxKRW})</span>
          </div>
          <div className="mt-0.5 text-xs text-neutral-500">Tax & Service Fee Included</div>
        </div>

        <div className="flex shrink-0 items-center gap-1 text-sm text-neutral-900">
          <Star className="h-4 w-4" />
          <span>{listing.rating.toFixed(2)}</span>
        </div>
      </div>
    </Link>
  );
}
