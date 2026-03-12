"use client";

import Link from "next/link";
import Image from "next/image";
import { Heart } from "lucide-react";
import { useMemo, useState } from "react";
import { useWishlist } from "@/components/ui/WishlistProvider";
import { useAuth } from "@/components/ui/AuthProvider";
import { useAuthModal } from "@/components/ui/AuthModalProvider";
import { useI18n } from "@/components/ui/LanguageProvider";
import { totalGuestPriceKRW } from "@/lib/policy";
import { useCurrency } from "@/components/ui/CurrencyProvider";
import { useExchangeRates } from "@/components/ui/ExchangeRatesProvider";

function toNumber(value: unknown, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

type ListingCardProps = Record<string, unknown> & {
  variant?: "default" | "compact";
};

export default function ListingCard(props: ListingCardProps) {
  const { t } = useI18n();
  const { isAuthed } = useAuth();
  const { open } = useAuthModal();
  const { has, toggle } = useWishlist();
  const { currency } = useCurrency();
  const { formatFromKRW } = useExchangeRates();

  const variant = props.variant ?? "default";
  const listing = (props?.listing ?? props) as Record<string, unknown>;
  const id = String(listing?.id ?? "");
  const href = (props?.href as string) ?? `/listings/${id}`;

  const title = (listing?.title ?? listing?.name ?? "Stay") as string;
  const area = (listing?.area ?? listing?.neighborhood ?? "") as string;
  const city = (listing?.city ?? listing?.region ?? "") as string;
  const rating = toNumber(listing?.rating, 0);
  const pricePerNightKRW = toNumber(
    listing?.pricePerNightKRW ?? listing?.basePriceKrw ?? listing?.priceKrw,
    0
  );
  const nightlyAllInKRW = totalGuestPriceKRW(Math.max(0, pricePerNightKRW));
  const nightlyText = formatFromKRW(nightlyAllInKRW, currency);

  const image = useMemo(() => {
    const arr = listing?.images;
    if (Array.isArray(arr) && arr.length) {
      const first = arr[0];
      return typeof first === "string" ? first : (first as { url?: string })?.url ?? "";
    }
    return (listing?.image ?? listing?.coverImage ?? "") as string;
  }, [listing]);

  const [imageError, setImageError] = useState(false);
  const showImage = image && !imageError;

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

  const isCompact = variant === "compact";

  return (
    <Link href={href} className="group block">
      <div className={
        isCompact
          ? "relative overflow-hidden rounded-2xl bg-neutral-100 aspect-square w-full md:aspect-auto md:h-[220px]"
          : "relative overflow-hidden rounded-2xl bg-neutral-100"
      }>
        {showImage ? (
          <Image
            src={image}
            alt={title}
            className={isCompact ? "h-full w-full object-cover md:h-[220px]" : "h-[220px] w-full object-cover"}
            width={800}
            height={isCompact ? 400 : 440}
            sizes={isCompact ? "(max-width: 767px) 38vw, (max-width: 1280px) 50vw, 260px" : "(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 25vw"}
            onError={() => setImageError(true)}
          />
        ) : (
          <div className={`flex items-center justify-center bg-neutral-200 text-neutral-400 ${isCompact ? "aspect-square w-full md:aspect-auto md:h-[220px]" : "h-[220px] w-full"}`}>
            <span className="text-xs font-medium">No photo</span>
          </div>
        )}

        <button
          type="button"
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); onToggle(e); }}
          className="group/heart absolute right-2 top-2 z-10 inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/95 shadow-md hover:shadow-lg transition md:right-3 md:top-3 md:h-10 md:w-10"
          aria-label="Wishlist"
          title={liked ? "Saved" : "Save"}
        >
          <Heart className={liked ? "h-4 w-4 fill-[#E73587] text-[#E73587] md:h-5 md:w-5" : "h-4 w-4 md:h-5 md:w-5 group-hover/heart:fill-[#E73587] group-hover/heart:text-[#E73587] transition-colors"} />
        </button>
      </div>

      <div className={isCompact ? "mt-2 grid grid-cols-[1fr,auto] gap-1 md:mt-3 md:gap-2" : "mt-3 grid grid-cols-[1fr,auto] gap-2"}>
        <div className="min-w-0">
          <div className={isCompact ? "text-xs font-semibold truncate md:text-sm" : "text-sm font-semibold truncate"}>
            {city ? `${city}${area ? ` · ${area}` : ""}` : title}
          </div>
          {!isCompact && <div className="mt-1 text-xs text-neutral-500 truncate">{title}</div>}
          <div className={isCompact ? "mt-1 text-xs font-semibold md:mt-2 md:text-sm" : "mt-2 text-sm font-semibold"}>
            {nightlyText} <span className="font-normal text-neutral-500">{t("per_night")}</span>
          </div>
          <div className={isCompact ? "mt-0.5 text-[10px] text-neutral-500 md:text-xs" : "mt-1 text-xs text-neutral-500"}>
            {t("tax_service_included")}
          </div>
        </div>

        <div className={isCompact ? "text-xs text-neutral-700 inline-flex items-center gap-0.5 md:text-sm md:gap-1" : "text-sm text-neutral-700 inline-flex items-center gap-1"}>
          <span>★</span>
          <span className="font-semibold">{Number(rating || 0).toFixed(2)}</span>
        </div>
      </div>
    </Link>
  );
}
