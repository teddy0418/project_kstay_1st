"use client";

import { Heart, Share2 } from "lucide-react";
import { useToast } from "@/components/ui/ToastProvider";

export default function DetailActions({ listingId }: { listingId: string }) {
  const { toast } = useToast();
  const isLoggedIn = false;

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast("Link copied");
    } catch {
      toast("Copy failed (browser restriction).");
    }
  };

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={() => {
          if (!isLoggedIn) {
            toast("Log in to save stays (1-second login coming soon).");
            return;
          }
          toast("Saved to Wishlist (MVP).");
        }}
        className="group/heart relative inline-flex h-10 w-10 items-center justify-center rounded-full border border-neutral-200 hover:bg-neutral-50 transition"
        aria-label="Save"
      >
        <Heart className="h-5 w-5 text-neutral-900 opacity-100 transition-opacity duration-150 group-hover/heart:opacity-0" />
        <Heart
          className="absolute h-5 w-5 text-rose-500 opacity-0 transition-opacity duration-150 group-hover/heart:opacity-100"
          fill="currentColor"
        />
      </button>

      <button
        type="button"
        onClick={copyLink}
        className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-neutral-200 hover:bg-neutral-50 transition"
        aria-label="Share"
      >
        <Share2 className="h-5 w-5" />
      </button>
    </div>
  );
}
