"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CalendarDays, MapPin, Minus, Plus, Search, Users, X } from "lucide-react";
import { formatDateRange } from "@/lib/format";
import { cn } from "@/lib/utils";

type Panel = "where" | "when" | "guests" | null;

type Draft = {
  where: string;
  start: string;
  end: string;
  adults: number;
  children: number;
  infants: number;
  pets: boolean;
  serviceAnimal: boolean;
};

const suggestions = [
  { label: "Seoul", value: "Seoul" },
  { label: "Busan", value: "Busan" },
  { label: "Jeju", value: "Jeju" },
  { label: "Gyeongju", value: "Gyeongju" },
  { label: "Gangneung", value: "Gangneung" },
];

function safeInt(v: string | null, fallback = 0) {
  if (!v) return fallback;
  const n = Number.parseInt(v, 10);
  return Number.isFinite(n) ? n : fallback;
}

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

function RowCounter({
  title,
  subtitle,
  value,
  onDec,
  onInc,
}: {
  title: string;
  subtitle: string;
  value: number;
  onDec: () => void;
  onInc: () => void;
}) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <div className="text-sm font-semibold">{title}</div>
        <div className="text-xs text-neutral-500">{subtitle}</div>
      </div>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onDec}
          className={cn(
            "inline-flex h-9 w-9 items-center justify-center rounded-full border",
            value <= 0 ? "border-neutral-200 text-neutral-300" : "border-neutral-300 hover:bg-neutral-50"
          )}
          aria-label={`Decrease ${title}`}
          disabled={value <= 0}
        >
          <Minus className="h-4 w-4" />
        </button>
        <div className="w-8 text-center text-sm font-semibold">{value}</div>
        <button
          type="button"
          onClick={onInc}
          className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-neutral-300 hover:bg-neutral-50"
          aria-label={`Increase ${title}`}
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

export default function SearchBar() {
  const router = useRouter();
  const sp = useSearchParams();

  const current = useMemo<Draft>(() => {
    const where = sp.get("where") ?? "";
    const start = sp.get("start") ?? "";
    const end = sp.get("end") ?? "";
    const adults = clamp(safeInt(sp.get("adults"), 0), 0, 16);
    const children = clamp(safeInt(sp.get("children"), 0), 0, 16);
    const infants = clamp(safeInt(sp.get("infants"), 0), 0, 8);
    const pets = sp.get("pets") === "1";
    const serviceAnimal = sp.get("sa") === "1";
    return { where, start, end, adults, children, infants, pets, serviceAnimal };
  }, [sp]);

  const [open, setOpen] = useState(false);
  const [panel, setPanel] = useState<Panel>(null);
  const [draft, setDraft] = useState<Draft>(current);

  useEffect(() => {
    if (open) setDraft(current);
  }, [open, current]);

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

  const openPanel = (p: Panel) => {
    setOpen(true);
    setPanel(p);
  };

  const whereLabel = current.where.trim() ? current.where.trim() : "Anywhere";
  const whenLabel =
    current.start && current.end ? formatDateRange(current.start, current.end) : "Any week";
  const guestCount = current.adults + current.children;
  const guestsLabel =
    guestCount > 0
      ? `${guestCount} ${guestCount === 1 ? "guest" : "guests"}${current.infants > 0 ? `, ${current.infants} infants` : ""}`
      : "Add guests";

  const applySearch = () => {
    const params = new URLSearchParams(sp.toString());
    const where = draft.where.trim();
    if (where) params.set("where", where);
    else params.delete("where");
    if (draft.start && draft.end) {
      params.set("start", draft.start);
      params.set("end", draft.end);
    } else {
      params.delete("start");
      params.delete("end");
    }
    if (draft.adults > 0) params.set("adults", String(draft.adults));
    else params.delete("adults");
    if (draft.children > 0) params.set("children", String(draft.children));
    else params.delete("children");
    if (draft.infants > 0) params.set("infants", String(draft.infants));
    else params.delete("infants");
    if (draft.pets) params.set("pets", "1");
    else params.delete("pets");
    if (draft.serviceAnimal) params.set("sa", "1");
    else params.delete("sa");
    const totalGuests = draft.adults + draft.children;
    if (totalGuests > 0) params.set("guests", String(totalGuests));
    else params.delete("guests");
    const qs = params.toString();
    router.push(qs ? `/browse?${qs}` : "/browse");
    setOpen(false);
  };

  const clearAll = () => {
    const params = new URLSearchParams(sp.toString());
    ["where", "start", "end", "guests", "adults", "children", "infants", "pets", "sa"].forEach(
      (k) => params.delete(k)
    );
    const qs = params.toString();
    router.push(qs ? `/browse?${qs}` : "/browse");
    setOpen(false);
  };

  const setStart = (v: string) => {
    setDraft((d) => {
      const next = { ...d, start: v };
      if (next.end && v && next.end < v) next.end = v;
      return next;
    });
  };

  const setEnd = (v: string) => {
    setDraft((d) => {
      const next = { ...d, end: v };
      if (next.start && v && v < next.start) next.start = v;
      return next;
    });
  };

  return (
    <div className="w-full flex justify-center">
      <div className="w-full max-w-[980px]">
        <div className="rounded-full border border-neutral-200 bg-white shadow-soft hover:shadow-elevated transition px-2 py-2">
          <div className="grid grid-cols-[1.3fr_auto_1fr_auto_1.2fr_auto] items-center">
            <button
              type="button"
              onClick={() => openPanel("where")}
              className="text-left rounded-full px-4 py-2 hover:bg-neutral-50"
            >
              <div className="text-[11px] font-semibold text-neutral-600">WHERE</div>
              <div className="text-sm font-semibold text-neutral-900 flex items-center gap-2">
                <MapPin className="h-4 w-4 text-neutral-500" />
                <span className="truncate">{whereLabel}</span>
              </div>
            </button>
            <div className="h-8 w-px bg-neutral-200" />
            <button
              type="button"
              onClick={() => openPanel("when")}
              className="text-left rounded-full px-4 py-2 hover:bg-neutral-50"
            >
              <div className="text-[11px] font-semibold text-neutral-600">WHEN</div>
              <div className="text-sm font-semibold text-neutral-900 flex items-center gap-2">
                <CalendarDays className="h-4 w-4 text-neutral-500" />
                <span className="truncate">{whenLabel}</span>
              </div>
            </button>
            <div className="h-8 w-px bg-neutral-200" />
            <button
              type="button"
              onClick={() => openPanel("guests")}
              className="text-left rounded-full px-4 py-2 hover:bg-neutral-50"
            >
              <div className="text-[11px] font-semibold text-neutral-600">WHO</div>
              <div className="text-sm font-semibold text-neutral-900 flex items-center gap-2">
                <Users className="h-4 w-4 text-neutral-500" />
                <span className="truncate">{guestsLabel}</span>
              </div>
            </button>
            <div className="flex justify-end pr-1">
              <button
                type="button"
                onClick={applySearch}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-brand text-brand-foreground hover:opacity-95"
                aria-label="Search"
              >
                <Search className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>

        {open && (
          <div className="fixed inset-0 z-[70]">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="absolute inset-0 bg-black/35"
              aria-label="Close"
            />
            <div className="absolute left-1/2 top-[140px] w-[min(860px,calc(100%-24px))] -translate-x-1/2 rounded-3xl bg-white shadow-elevated overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200">
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setPanel("where")}
                    className={cn(
                      "rounded-full px-4 py-2 text-sm font-semibold",
                      panel === "where"
                        ? "bg-neutral-900 text-white"
                        : "border border-neutral-200 hover:bg-neutral-50"
                    )}
                  >
                    Where
                  </button>
                  <button
                    type="button"
                    onClick={() => setPanel("when")}
                    className={cn(
                      "rounded-full px-4 py-2 text-sm font-semibold",
                      panel === "when"
                        ? "bg-neutral-900 text-white"
                        : "border border-neutral-200 hover:bg-neutral-50"
                    )}
                  >
                    When
                  </button>
                  <button
                    type="button"
                    onClick={() => setPanel("guests")}
                    className={cn(
                      "rounded-full px-4 py-2 text-sm font-semibold",
                      panel === "guests"
                        ? "bg-neutral-900 text-white"
                        : "border border-neutral-200 hover:bg-neutral-50"
                    )}
                  >
                    Who
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full hover:bg-neutral-100"
                  aria-label="Close"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="px-6 py-6">
                {panel === "where" && (
                  <div className="grid gap-5">
                    <div className="rounded-2xl border border-neutral-200 p-4">
                      <div className="text-xs font-semibold text-neutral-700">DESTINATION</div>
                      <input
                        value={draft.where}
                        onChange={(e) => setDraft((d) => ({ ...d, where: e.target.value }))}
                        placeholder="Search destinations (e.g., Seoul, Busan, Jeju)"
                        className="mt-2 w-full text-sm outline-none placeholder:text-neutral-400"
                      />
                    </div>
                    <div>
                      <div className="text-sm font-semibold">Recommended</div>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {suggestions.map((s) => (
                          <button
                            key={s.value}
                            type="button"
                            onClick={() => {
                              setDraft((d) => ({ ...d, where: s.value }));
                              setPanel("when");
                            }}
                            className="rounded-full border border-neutral-200 bg-white px-4 py-2 text-sm hover:bg-neutral-50"
                          >
                            {s.label}
                          </button>
                        ))}
                        <button
                          type="button"
                          onClick={() => {
                            setDraft((d) => ({ ...d, where: "" }));
                            setPanel("when");
                          }}
                          className="rounded-full border border-neutral-200 bg-white px-4 py-2 text-sm hover:bg-neutral-50 text-neutral-600"
                        >
                          Anywhere
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {panel === "when" && (
                  <div className="grid gap-4">
                    <div className="rounded-2xl border border-neutral-200 p-4">
                      <div className="text-xs font-semibold text-neutral-700">DATES</div>
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
                      <div className="mt-3 text-xs text-neutral-500">
                        Tip: pick both dates for a range. (MVP uses native calendar)
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setDraft((d) => ({ ...d, start: "", end: "" }))}
                        className="rounded-full border border-neutral-200 px-4 py-2 text-sm hover:bg-neutral-50"
                      >
                        Any week
                      </button>
                      <button
                        type="button"
                        onClick={() => setPanel("guests")}
                        className="rounded-full bg-neutral-900 px-4 py-2 text-sm font-semibold text-white hover:opacity-95"
                      >
                        Next: guests
                      </button>
                    </div>
                  </div>
                )}

                {panel === "guests" && (
                  <div className="grid gap-5">
                    <div className="rounded-2xl border border-neutral-200 p-4">
                      <div className="grid gap-4">
                        <RowCounter
                          title="Adults"
                          subtitle="Ages 13+"
                          value={draft.adults}
                          onDec={() =>
                            setDraft((d) => ({ ...d, adults: clamp(d.adults - 1, 0, 16) }))
                          }
                          onInc={() =>
                            setDraft((d) => ({ ...d, adults: clamp(d.adults + 1, 0, 16) }))
                          }
                        />
                        <div className="h-px bg-neutral-200" />
                        <RowCounter
                          title="Children"
                          subtitle="Ages 2–12"
                          value={draft.children}
                          onDec={() =>
                            setDraft((d) => ({ ...d, children: clamp(d.children - 1, 0, 16) }))
                          }
                          onInc={() =>
                            setDraft((d) => ({ ...d, children: clamp(d.children + 1, 0, 16) }))
                          }
                        />
                        <div className="h-px bg-neutral-200" />
                        <RowCounter
                          title="Infants"
                          subtitle="Under 2"
                          value={draft.infants}
                          onDec={() =>
                            setDraft((d) => ({ ...d, infants: clamp(d.infants - 1, 0, 8) }))
                          }
                          onInc={() =>
                            setDraft((d) => ({ ...d, infants: clamp(d.infants + 1, 0, 8) }))
                          }
                        />
                      </div>
                    </div>
                    <div className="rounded-2xl border border-neutral-200 p-4">
                      <div className="text-sm font-semibold">Traveling with animals?</div>
                      <label className="mt-3 flex items-center justify-between gap-3 text-sm">
                        <div>
                          <div className="font-medium">Pets</div>
                          <div className="text-xs text-neutral-500">
                            Some stays may not allow pets.
                          </div>
                        </div>
                        <input
                          type="checkbox"
                          checked={draft.pets}
                          onChange={(e) => setDraft((d) => ({ ...d, pets: e.target.checked }))}
                          className="h-5 w-5"
                        />
                      </label>
                      <div className="h-px bg-neutral-200 my-3" />
                      <label className="flex items-center justify-between gap-3 text-sm">
                        <div>
                          <div className="font-medium">Service animal</div>
                          <div className="text-xs text-neutral-500">
                            Are you traveling with a service animal?
                          </div>
                        </div>
                        <input
                          type="checkbox"
                          checked={draft.serviceAnimal}
                          onChange={(e) =>
                            setDraft((d) => ({ ...d, serviceAnimal: e.target.checked }))
                          }
                          className="h-5 w-5"
                        />
                      </label>
                    </div>
                  </div>
                )}
              </div>

              <div className="px-6 py-4 border-t border-neutral-200 flex items-center justify-between">
                <button
                  type="button"
                  onClick={clearAll}
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
    </div>
  );
}
