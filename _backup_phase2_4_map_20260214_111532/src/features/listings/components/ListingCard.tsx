import Link from "next/link";
import Image from "next/image";
import { Heart, Star } from "lucide-react";
import type { Listing } from "@/types";
import { formatDateRange, formatKRW } from "@/lib/format";

export default function ListingCard({ listing }: { listing: Listing }) {
  return (
    <Link href={`/listings/${listing.id}`} className="group">
      <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-neutral-100">
        <Image
          src={listing.imageUrl}
          alt={listing.title}
          fill
          className="object-cover transition duration-300 group-hover:scale-[1.03]"
          sizes="(min-width: 1280px) 320px, (min-width: 768px) 33vw, 100vw"
        />

        {/* (Wishlist coming later) - visual only for now */}
        <div className="absolute right-3 top-3 inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/90 shadow-soft">
          <Heart className="h-5 w-5 text-neutral-800" />
        </div>
      </div>

      <div className="mt-3 flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="font-medium text-neutral-900 truncate">{listing.location}</div>
          <div className="mt-0.5 text-sm text-neutral-600 truncate">{listing.title}</div>
          <div className="mt-0.5 text-sm text-neutral-600">
            {formatDateRange(listing.startDate, listing.endDate)}
          </div>
          <div className="mt-1 text-sm text-neutral-900">
            <span className="font-semibold">{formatKRW(listing.pricePerNightKRW)}</span> / night
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1 text-sm text-neutral-900">
          <Star className="h-4 w-4" />
          <span>{listing.rating.toFixed(2)}</span>
        </div>
      </div>
    </Link>
  );
}
