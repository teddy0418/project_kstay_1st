"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Minus, Plus, Search, X } from "lucide-react";
import { formatDateRange } from "@/lib/format";
import { cn } from "@/lib/utils";

type Draft = {
  where: string;
  start: string;
  end: string;
  guests: number; // 0 = unset
};

function clampGuests(n: number) {
  return Math.min(16, Math.max(0, n));
}

function safeInt(v: string | null, fallback = 0) {
  if (!v) return fallback;
  const n = Number.parseInt(v, 10);
  return Number.isFinite(n) ? n : fallback;
}

export default function SearchBar() {
  const router = useRouter();
  const sp = useSearchParams();

  const current = useMemo(() => {
    const where = sp.get("where") ?? "";
    const start = sp.get("start") ?? "";
    const end = sp.get("end") ?? "";
    const guests = clampGuests(safeInt(sp.get("guests"), 0));
    return { where, start, end, guests };
  }, [sp]);

  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<Draft>(current);

  // When opening, sync draft from URL
  useEffect(() => {
    if (open) setDraft(current);
  }, [open, current]);

  // Lock scroll + ESC close
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const summaryWhere = current.where.trim() ? current.where.trim() : "Anywhere";
  const summaryWhen =
    current.start && current.end ? formatDateRange(current.start, current.end) : "Any week";
  const summaryGuests =
    current.guests > 0 ? `${current.guests} ${current.guests === 1 ? "guest" : "guests"}` : "Add guests";

  const openModal = () => setOpen(true);

  const applySearch = () => {
    // Preserve existing params (e.g., category)
    const params = new URLSearchParams(sp.toString());

    const where = draft.where.trim();
    if (where) params.set("where", where);
    else params.delete("where");

    // Only set dates if both exist
    if (draft.start && draft.end) {
      params.set("start", draft.start);
      params.set("end", draft.end);
    } else {
      params.delete("start");
      params.delete("end");
    }

    const guests = clampGuests(draft.guests);
    if (guests > 0) params.set("guests", String(guests));
    else params.delete("guests");

    const qs = params.toString();
    router.push(qs ? `/?${qs}` : "/");
    setOpen(false);
  };

  const clearSearch = () => {
    // Clear only search-related keys, keep category if present
    const params = new URLSearchParams(sp.toString());
    params.delete("where");
    params.delete("start");
    params.delete("end");
    params.delete("guests");
    const qs = params.toString();
    router.push(qs ? `/?${qs}` : "/");
    setOpen(false);
  };

  // Date guard: if start > end, auto-fix end
  const setStart = (v: string) => {
    setDraft((d) => {
      const next: Draft = { ...d, start: v };
      if (next.end && v && next.end < v) next.end = v;
      return next;
    });
  };

  const setEnd = (v: string) => {
    setDraft((d) => {
      const next: Draft = { ...d, end: v };
      if (next.start && v && v < next.start) next.start = v;
      return next;
    });
  };

  return (
    <div className="flex flex-1 justify-center">
      {/* Desktop button */}
      <button
        type="button"
        onClick={openModal}
        className="hidden md:flex items-center rounded-full border border-neutral-200 bg-white shadow-soft hover:shadow-elevated transition px-2 py-2"
        aria-label="Open search"
      >
        <span className="px-4 text-sm font-medium text-neutral-900">{summaryWhere}</span>
        <span className="h-6 w-px bg-neutral-200" />
        <span className="px-4 text-sm font-medium text-neutral-900">{summaryWhen}</span>
        <span className="h-6 w-px bg-neutral-200" />
        <span className="pl-4 pr-2 text-sm text-neutral-600 flex items-center gap-2">
          {summaryGuests}
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-brand text-brand-foreground">
            <Search className="h-4 w-4" />
          </span>
        </span>
      </button>

      {/* Mobile button */}
      <button
        type="button"
        onClick={openModal}
        className="md:hidden w-full max-w-[520px] flex items-center gap-3 rounded-full border border-neutral-200 bg-white shadow-soft px-4 py-3"
        aria-label="Open search"
      >
        <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-brand/10">
          <Search className="h-5 w-5 text-brand" />
        </span>
        <div className="text-left min-w-0">
          <div className="text-sm font-semibold text-neutral-900 truncate">{summaryWhere}</div>
          <div className="text-xs text-neutral-600 truncate">{summaryWhen} · {summaryGuests}</div>
        </div>
      </button>

      {/* Modal */}
      {open && (
        <div className="fixed inset-0 z-[60]">
          {/* Backdrop */}
          <button
            aria-label="Close"
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-black/35"
            type="button"
          />

          {/* Panel */}
          <div
            role="dialog"
            aria-modal="true"
            className="absolute left-1/2 top-[84px] w-[min(760px,calc(100%-24px))] -translate-x-1/2 rounded-3xl bg-white shadow-elevated overflow-hidden"
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200">
              <div className="text-sm font-semibold">Search</div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full hover:bg-neutral-100"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="px-6 py-6 grid gap-6">
              {/* Where */}
              <div className="rounded-2xl border border-neutral-200 p-4">
                <div className="text-xs font-semibold text-neutral-700">WHERE</div>
                <input
                  value={draft.where}
                  onChange={(e) => setDraft((d) => ({ ...d, where: e.target.value }))}
                  placeholder="Search destinations (e.g., Seoul, Busan, Jeju)"
                  className="mt-2 w-full text-sm outline-none placeholder:text-neutral-400"
                />
              </div>

              {/* When */}
              <div className="rounded-2xl border border-neutral-200 p-4">
                <div className="text-xs font-semibold text-neutral-700">WHEN</div>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <label className="grid gap-1">
                    <span className="text-xs text-neutral-600">Check-in</span>
                    <input
                      type="date"
                      value={draft.start}
                      onChange={(e) => setStart(e.target.value)}
                      className="w-full rounded-xl border border-neutral-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand/20"
                    />
                  </label>
                  <label className="grid gap-1">
                    <span className="text-xs text-neutral-600">Check-out</span>
                    <input
                      type="date"
                      value={draft.end}
                      onChange={(e) => setEnd(e.target.value)}
                      className="w-full rounded-xl border border-neutral-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand/20"
                    />
                  </label>
                </div>
                <div className="mt-2 text-xs text-neutral-500">
                  Tip: dates are optional — set both for a range.
                </div>
              </div>

              {/* Guests */}
              <div className="rounded-2xl border border-neutral-200 p-4">
                <div className="text-xs font-semibold text-neutral-700">GUESTS</div>
                <div className="mt-3 flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium">Guests</div>
                    <div className="text-xs text-neutral-500">How many people are staying?</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setDraft((d) => ({ ...d, guests: clampGuests(d.guests - 1) }))}
                      className={cn(
                        "inline-flex h-9 w-9 items-center justify-center rounded-full border",
                        draft.guests <= 0 ? "border-neutral-200 text-neutral-300" : "border-neutral-300 hover:bg-neutral-50"
                      )}
                      aria-label="Decrease guests"
                      disabled={draft.guests <= 0}
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                    <div className="w-10 text-center text-sm font-semibold">
                      {draft.guests <= 0 ? "Any" : draft.guests}
                    </div>
                    <button
                      type="button"
                      onClick={() => setDraft((d) => ({ ...d, guests: clampGuests(d.guests + 1) }))}
                      className={cn(
                        "inline-flex h-9 w-9 items-center justify-center rounded-full border border-neutral-300 hover:bg-neutral-50",
                        draft.guests >= 16 && "opacity-50 pointer-events-none"
                      )}
                      aria-label="Increase guests"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-neutral-200 flex items-center justify-between">
              <button
                type="button"
                onClick={clearSearch}
                className="text-sm font-semibold text-neutral-700 hover:text-neutral-900"
              >
                Clear all
              </button>
              <button
                type="button"
                onClick={applySearch}
                className="inline-flex items-center gap-2 rounded-xl bg-brand px-5 py-3 text-sm font-semibold text-brand-foreground hover:opacity-95"
              >
                <Search className="h-4 w-4" />
                Search
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
