"use client";

import { useEffect } from "react";
import { useParams } from "next/navigation";

const KEY = "kst_recently_viewed";

function read(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    const arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? arr.map(String) : [];
  } catch {
    return [];
  }
}

function write(ids: string[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(ids));
  } catch {}
}

export default function ListingViewTracker() {
  const params = useParams<{ id: string }>();
  const idRaw = params?.id;
  const id = typeof idRaw === "string" ? idRaw : Array.isArray(idRaw) ? idRaw[0] : "";

  useEffect(() => {
    if (!id) return;
    const prev = read();
    const next = [id, ...prev.filter((x) => x !== id)].slice(0, 20);
    write(next);
  }, [id]);

  return null;
}
