"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/components/ui/AuthProvider";
import { apiClient, ApiClientError } from "@/lib/api/client";

type WishlistCtx = {
  ids: string[];
  has: (id: string) => boolean;
  toggle: (id: string) => Promise<{ ok: boolean; reason?: "LOGIN_REQUIRED" }>;
  clear: () => Promise<void>;
};

const WishlistContext = createContext<WishlistCtx | null>(null);

export default function WishlistProvider({ children }: { children: React.ReactNode }) {
  const { user, isAuthed, isLoading } = useAuth();
  const [ids, setIds] = useState<string[]>([]);

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthed || !user?.id) {
      queueMicrotask(() => setIds([]));
      return;
    }

    void (async () => {
      try {
        const list = await apiClient.get<string[]>("/api/wishlist");
        setIds(list);
      } catch (err) {
        if (err instanceof ApiClientError && err.status === 401) {
          setIds([]);
          return;
        }
      }
    })();
  }, [isAuthed, user?.id, isLoading]);

  const has = useCallback(
    (id: string) => (isAuthed ? ids.includes(id) : false),
    [isAuthed, ids]
  );

  const toggle = useCallback(
    async (id: string) => {
      if (!isAuthed || !user?.id) return { ok: false, reason: "LOGIN_REQUIRED" as const };

      const exists = ids.includes(id);
      setIds((prev) => (exists ? prev.filter((x) => x !== id) : [...prev, id]));

      try {
        if (exists) {
          await apiClient.delete<{ listingId: string }>(`/api/wishlist/${encodeURIComponent(id)}`);
        } else {
          await apiClient.post<{ listingId: string }>("/api/wishlist", { listingId: id });
        }
        return { ok: true };
      } catch (err) {
        setIds((prev) => (exists ? [...prev, id] : prev.filter((x) => x !== id)));
        if (err instanceof ApiClientError && err.status === 401) {
          return { ok: false, reason: "LOGIN_REQUIRED" as const };
        }
        return { ok: false };
      }
    },
    [isAuthed, user, ids]
  );

  const clear = useCallback(async () => {
    if (!isAuthed || !user?.id) return;
    setIds([]);
    try {
      await apiClient.delete<{ cleared: boolean }>("/api/wishlist");
    } catch {
      // ignore clear failures and keep UI responsive
    }
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
