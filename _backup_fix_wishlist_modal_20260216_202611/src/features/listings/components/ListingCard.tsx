"use client";

import Link from "next/link";
import { Heart } from "lucide-react";
import { useMemo } from "react";
import { useWishlist } from "@/components/ui/WishlistProvider";
import { useRouter, usePathname } from "next/navigation";

type ListingLike = {
  id?: string;
  title?: string;
  name?: string;
  location?: string;
  area?: string;
  neighborhood?: string;
  city?: string;
  region?: string;
  rating?: number;
  priceUsd?: number;
  priceUSD?: number;
  pricePerNightUsd?: number;
  pricePerNightKRW?: number;
  usd?: number;
  images?: string[];
  image?: string;
  coverImage?: string;
};

export default function ListingCard(props: {
  listing?: ListingLike;
  href?: string;
  [key: string]: unknown;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { has, toggle } = useWishlist();

  const listing = (props?.listing ?? props) as ListingLike;
  const id = String(listing?.id ?? "");
  const href = (props?.href as string) ?? (id ? `/listings/${id}` : "/listings");

  const title = listing?.title ?? listing?.name ?? "Stay";
  const area = listing?.area ?? listing?.neighborhood ?? "";
  const city = listing?.city ?? listing?.region ?? "";
  const location = listing?.location ?? "";
  const rating = listing?.rating ?? 0;
  const priceUsd =
    listing?.priceUsd ??
    listing?.priceUSD ??
    listing?.pricePerNightUsd ??
    listing?.usd ??
    0;
  const pricePerNightKRW = listing?.pricePerNightKRW ?? 0;
  const displayPrice =
    priceUsd > 0
      ? `$${priceUsd}`
      : pricePerNightKRW > 0
        ? `${new Intl.NumberFormat("ko-KR").format(pricePerNightKRW)}원`
        : "";

  const image = useMemo(() => {
    const arr = listing?.images;
    if (Array.isArray(arr) && arr.length) return arr[0];
    return listing?.image ?? listing?.coverImage ?? "";
  }, [listing]);

  const liked = id ? has(id) : false;

  const onToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!id) return;
    const res = toggle(id);
    if (!res.ok) {
      router.push(`/login?next=${encodeURIComponent(pathname ?? "/")}`);
    }
  };

  return (
    <Link href={href} className="group block">
      <div className="relative overflow-hidden rounded-2xl bg-neutral-100">
        {image ? (
          <img
            src={image}
            alt={title}
            className="h-[220px] w-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="h-[220px] w-full" />
        )}

        <button
          type="button"
          onClick={onToggle}
          className="absolute right-3 top-3 inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/95 shadow-md hover:shadow-lg transition"
          aria-label="Wishlist"
          title={liked ? "Saved" : "Save"}
        >
          <Heart className={liked ? "h-5 w-5 fill-red-500 text-red-500" : "h-5 w-5"} />
        </button>
      </div>

      <div className="mt-3 grid grid-cols-[1fr,auto] gap-2">
        <div className="min-w-0">
          <div className="text-sm font-semibold truncate">
            {city ? `${city}${area ? ` · ${area}` : ""}` : location || title}
          </div>
          <div className="mt-1 text-xs text-neutral-500 truncate">{title}</div>
          {displayPrice && (
            <div className="mt-2 text-sm font-semibold">
              {displayPrice}{" "}
              <span className="font-normal text-neutral-500">/ night</span>
            </div>
          )}
          <div className="mt-1 text-xs text-neutral-500">Tax &amp; Service Fee Included</div>
        </div>

        <div className="text-sm text-neutral-700 inline-flex items-center gap-1">
          <span>★</span>
          <span className="font-semibold">{Number(rating || 0).toFixed(2)}</span>
        </div>
      </div>
    </Link>
  );
}
