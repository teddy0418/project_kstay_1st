"use client";

import Link from "next/link";
import Image from "next/image";
import { Heart } from "lucide-react";
import { useMemo } from "react";
import { useWishlist } from "@/components/ui/WishlistProvider";
import { useAuth } from "@/components/ui/AuthProvider";
import { useAuthModal } from "@/components/ui/AuthModalProvider";

export default function ListingCard(props: Record<string, unknown>) {
  const { isAuthed } = useAuth();
  const { open } = useAuthModal();
  const { has, toggle } = useWishlist();

  const listing = (props?.listing ?? props) as Record<string, unknown>;
  const id = String(listing?.id ?? "");
  const href = (props?.href as string) ?? `/listings/${id}`;

  const title = (listing?.title ?? listing?.name ?? "Stay") as string;
  const area = (listing?.area ?? listing?.neighborhood ?? "") as string;
  const city = (listing?.city ?? listing?.region ?? "") as string;
  const rating = (listing?.rating ?? 0) as number;
  const priceUsd = (listing?.priceUsd ?? listing?.priceUSD ?? listing?.pricePerNightUsd ?? listing?.usd ?? 0) as number;

  const image = useMemo(() => {
    const arr = listing?.images;
    if (Array.isArray(arr) && arr.length) return arr[0] as string;
    return (listing?.image ?? listing?.coverImage ?? "") as string;
  }, [listing]);

  const liked = isAuthed && id ? has(id) : false;

  const onToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!id) return;

    if (!isAuthed) {
      open({ role: "GUEST" });
      return;
    }

    toggle(id);
  };

  return (
    <Link href={href} className="group block">
      <div className="relative overflow-hidden rounded-2xl bg-neutral-100">
        {image ? (
          <Image
            src={image}
            alt={title}
            className="h-[220px] w-full object-cover"
            width={800}
            height={440}
            sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 25vw"
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
            {city ? `${city}${area ? ` · ${area}` : ""}` : title}
          </div>
          <div className="mt-1 text-xs text-neutral-500 truncate">{title}</div>
          <div className="mt-2 text-sm font-semibold">
            ${priceUsd} <span className="font-normal text-neutral-500">/ night</span>
          </div>
          <div className="mt-1 text-xs text-neutral-500">Tax & Service Fee Included</div>
        </div>

        <div className="text-sm text-neutral-700 inline-flex items-center gap-1">
          <span>★</span>
          <span className="font-semibold">{Number(rating || 0).toFixed(2)}</span>
        </div>
      </div>
    </Link>
  );
}
