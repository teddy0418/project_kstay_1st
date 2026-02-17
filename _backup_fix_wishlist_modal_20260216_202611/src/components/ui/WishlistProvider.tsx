"use client";

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/components/ui/AuthProvider";

type WishlistCtx = {
  ids: string[];
  has: (id: string) => boolean;
  toggle: (id: string) => { ok: boolean; reason?: "LOGIN_REQUIRED" };
  clear: () => void;
};

const WishlistContext = createContext<WishlistCtx | null>(null);

function keyFor(userId: string | null) {
  return userId ? `kstay_wishlist:${userId}` : "kstay_wishlist:guest";
}

function loadIds(key: string): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr.map(String) : [];
  } catch {
    return [];
  }
}

function saveIds(key: string, ids: string[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(ids));
  } catch {}
}

export default function WishlistProvider({ children }: { children: React.ReactNode }) {
  const { user, isAuthed } = useAuth();
  const storageKey = keyFor(user?.id ?? null);

  const [ids, setIds] = useState<string[]>([]);

  useEffect(() => {
    setIds(loadIds(storageKey));
  }, [storageKey]);

  const has = (id: string) => ids.includes(String(id));

  const toggle = (id: string) => {
    if (!isAuthed) {
      return { ok: false, reason: "LOGIN_REQUIRED" as const };
    }
    const x = String(id);
    setIds((prev) => {
      const next = prev.includes(x) ? prev.filter((v) => v !== x) : [...prev, x];
      saveIds(storageKey, next);
      return next;
    });
    return { ok: true };
  };

  const clear = () => {
    setIds([]);
    saveIds(storageKey, []);
  };

  const value = useMemo<WishlistCtx>(() => ({ ids, has, toggle, clear }), [ids, storageKey]);

  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
}

export function useWishlist() {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error("useWishlist must be used within <WishlistProvider/>");
  return ctx;
}

