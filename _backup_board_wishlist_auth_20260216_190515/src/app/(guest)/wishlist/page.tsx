"use client";

import Container from "@/components/layout/Container";
import { listings } from "@/lib/mockData";
import { useWishlist } from "@/components/ui/useWishlist";
import ListingCard from "@/features/listings/components/ListingCard";
import { useAuthModal } from "@/components/ui/auth/AuthModalProvider";
import { useEffect, useState } from "react";
import { ROLE_COOKIE } from "@/lib/auth/session";

function getCookie(name: string) {
  if (typeof document === "undefined") return null;
  const v = document.cookie
    .split("; ")
    .find((row) => row.startsWith(name + "="))
    ?.split("=")[1];
  return v ? decodeURIComponent(v) : null;
}

export default function WishlistPage() {
  const { ids } = useWishlist();
  const { openAuth } = useAuthModal();
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    queueMicrotask(() => setLoggedIn(!!getCookie(ROLE_COOKIE)));
  }, []);

  if (!loggedIn) {
    return (
      <Container className="py-10">
        <h1 className="text-2xl font-semibold tracking-tight">Wishlist</h1>
        <p className="mt-2 text-sm text-neutral-600">Log in to save and view your favorite stays.</p>
        <button
          type="button"
          onClick={() => openAuth({ next: "/wishlist", role: "guest" })}
          className="mt-5 rounded-xl bg-neutral-900 px-5 py-3 text-sm font-semibold text-white hover:opacity-95 transition"
        >
          Log in / Sign up
        </button>
      </Container>
    );
  }

  const saved = listings.filter((l) => ids.includes(String(l.id)));

  return (
    <Container className="py-10">
      <h1 className="text-2xl font-semibold tracking-tight">Wishlist</h1>

      {saved.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-neutral-200 p-6 text-sm text-neutral-600">
          No saved stays yet. Tap the heart on a listing to save it.
        </div>
      ) : (
        <div className="mt-6 grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {saved.map((l) => (
            <ListingCard key={l.id} listing={l} />
          ))}
        </div>
      )}
    </Container>
  );
}
