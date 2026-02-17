"use client";

import { Heart, Share2 } from "lucide-react";
import { useMemo } from "react";
import { useWishlist } from "@/components/ui/WishlistProvider";
import { useAuth } from "@/components/ui/AuthProvider";
import { useAuthModal } from "@/components/ui/AuthModalProvider";

export default function DetailActions(props: Record<string, unknown>) {
  const { isAuthed } = useAuth();
  const { open } = useAuthModal();
  const { has, toggle } = useWishlist();

  const id = useMemo(() => {
    return props?.listingId ?? props?.id ?? (props?.listing as Record<string, unknown>)?.id ?? "";
  }, [props]);

  const liked = isAuthed && id ? has(String(id)) : false;

  const onToggle = () => {
    if (!id) return;
    if (!isAuthed) {
      open({ role: "GUEST" });
      return;
    }
    toggle(String(id));
  };

  const onShare = async () => {
    try {
      const url = window.location.href;
      if (navigator.share) {
        await navigator.share({ title: "KSTAY", url });
      } else {
        await navigator.clipboard.writeText(url);
        alert("Link copied");
      }
    } catch {}
  };

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={onToggle}
        className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-neutral-200 bg-white shadow-sm hover:shadow-md transition"
        aria-label="Wishlist"
        title={liked ? "Remove from wishlist" : "Save to wishlist"}
      >
        <Heart className={liked ? "h-5 w-5 fill-red-500 text-red-500" : "h-5 w-5"} />
      </button>

      <button
        type="button"
        onClick={onShare}
        className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-neutral-200 bg-white shadow-sm hover:shadow-md transition"
        aria-label="Share"
        title="Share"
      >
        <Share2 className="h-5 w-5" />
      </button>
    </div>
  );
}
