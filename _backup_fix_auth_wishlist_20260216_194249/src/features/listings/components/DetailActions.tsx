"use client";

import { Heart, Share2 } from "lucide-react";
import { useMemo } from "react";
import { useWishlist } from "@/components/ui/WishlistProvider";
import { useI18n } from "@/components/ui/LanguageProvider";
import { useToast } from "@/components/ui/ToastProvider";

export function DetailActions(props: { listingId?: string; id?: string; listing?: { id?: string } }) {
  const { t } = useI18n();
  const { has, toggle } = useWishlist();
  const { toast } = useToast();

  const id = useMemo(() => {
    return props?.listingId ?? props?.id ?? props?.listing?.id ?? "";
  }, [props?.listingId, props?.id, props?.listing?.id]);

  const liked = id ? has(String(id)) : false;

  const onToggle = () => {
    if (!id) return;
    const res = toggle(String(id));
    if (!res.ok && res.reason === "LOGIN_REQUIRED") {
      toast(t("login_required_wishlist"));
    }
  };

  const onShare = async () => {
    try {
      const url = window.location.href;
      if (navigator.share) {
        await navigator.share({ title: "KSTAY", url });
      } else {
        await navigator.clipboard.writeText(url);
        toast(t("link_copied"));
      }
    } catch {
      // ignore
    }
  };

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={onToggle}
        className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-neutral-200 bg-white shadow-sm hover:shadow-md transition"
        aria-label="Wishlist"
        title={liked ? t("remove_wishlist") : t("add_wishlist")}
      >
        <Heart className={liked ? "h-5 w-5 fill-red-500 text-red-500" : "h-5 w-5"} />
      </button>

      <button
        type="button"
        onClick={onShare}
        className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-neutral-200 bg-white shadow-sm hover:shadow-md transition"
        aria-label="Share"
        title={t("share")}
      >
        <Share2 className="h-5 w-5" />
      </button>
    </div>
  );
}

export default DetailActions;
