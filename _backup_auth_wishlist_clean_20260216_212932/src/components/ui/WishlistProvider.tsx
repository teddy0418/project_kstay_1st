"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/components/ui/AuthProvider";

type WishlistCtx = {
  ids: string[];
  has: (id: string) => boolean;
  toggle: (id: string) => { ok: boolean; reason?: "LOGIN_REQUIRED" };
  clear: () => void;
};

const WishlistContext = createContext<WishlistCtx | null>(null);

function keyFor(userId: string) {
  return `kstay_wishlist:${userId}`;
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

  const [ids, setIds] = useState<string[]>([]);

  useEffect(() => {
    if (!isAuthed || !user?.id) {
      queueMicrotask(() => setIds([]));
      return;
    }
    queueMicrotask(() => setIds(loadIds(keyFor(user.id))));
  }, [isAuthed, user?.id]);

  const has = useCallback(
    (id: string) => {
      if (!isAuthed) return false;
      return ids.includes(id);
    },
    [isAuthed, ids]
  );

  const toggle = useCallback(
    (id: string) => {
      if (!isAuthed || !user?.id) return { ok: false, reason: "LOGIN_REQUIRED" as const };

      const storageKey = keyFor(user.id);
      setIds((prev) => {
        const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
        saveIds(storageKey, next);
        return next;
      });

      return { ok: true };
    },
    [isAuthed, user]
  );

  const clear = useCallback(() => {
    if (!isAuthed || !user?.id) return;
    const storageKey = keyFor(user.id);
    setIds([]);
    saveIds(storageKey, []);
  }, [isAuthed, user]);

  const value = useMemo<WishlistCtx>(
    () => ({ ids, has, toggle, clear }),
    [ids, has, toggle, clear]
  );

  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
}

export function useWishlist() {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error("useWishlist must be used within <WishlistProvider/>");
  return ctx;
}
