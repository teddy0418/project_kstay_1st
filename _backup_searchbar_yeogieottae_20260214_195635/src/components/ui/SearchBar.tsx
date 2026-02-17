"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Minus, Plus, Search, X } from "lucide-react";
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

const suggestions = ["Seoul", "Busan", "Jeju", "Gyeongju", "Gangneung"];

function safeInt(v: string | null, fallback = 0) {
  if (!v) return fallback;
  const n = Number.parseInt(v, 10);
  return Number.isFinite(n) ? n : fallback;
}

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
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

  const [mounted, setMounted] = useState(false);
  const [entered, setEntered] = useState(false);

  const [panel, setPanel] = useState<Panel>(null);
  const [draft, setDraft] = useState<Draft>(current);

  useEffect(() => {
    if (!mounted) return;
    setDraft(current);
  }, [mounted, current]);

  useEffect(() => {
    if (!mounted) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKeyDown);

    requestAnimationFrame(() => setEntered(true));

    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [mounted]);

  const openTo = (p: Panel) => {
    setPanel(p);
    setMounted(true);
  };

  const close = () => {
    setEntered(false);
    setTimeout(() => setMounted(false), 180);
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
    close();
  };

  const clearAll = () => {
    const params = new URLSearchParams(sp.toString());
    ["where", "start", "end", "guests", "adults", "children", "infants", "pets", "sa"].forEach(
      (k) => params.delete(k)
    );
    const qs = params.toString();
    router.push(qs ? `/browse?${qs}` : "/browse");
    close();
  };

  const segBase =
    "flex-1 rounded-full px-5 py-3 text-left text-sm font-semibold transition hover:bg-neutral-50";
  const segActive = "bg-neutral-100";

  return (
    <div className="w-full flex justify-center">
      <div className="w-full max-w-[1040px]">
        <div
          className={cn(
            "rounded-full border border-neutral-200 bg-white shadow-soft hover:shadow-elevated transition",
            mounted && "ring-2 ring-brand/15 shadow-elevated"
          )}
        >
          <div className="flex items-center">
            <button
              type="button"
              onClick={() => openTo("where")}
              className={cn(segBase, panel === "where" && mounted && segActive)}
            >
              {whereLabel}
            </button>
            <div className="h-8 w-px bg-neutral-200" />
            <button
              type="button"
              onClick={() => openTo("when")}
              className={cn(segBase, panel === "when" && mounted && segActive)}
            >
              {whenLabel}
            </button>
            <div className="h-8 w-px bg-neutral-200" />
            <button
              type="button"
              onClick={() => openTo("guests")}
              className={cn(segBase, panel === "guests" && mounted && segActive)}
            >
              <span className={cn(guestCount > 0 ? "text-neutral-900" : "text-neutral-500")}>
                {guestsLabel}
              </span>
            </button>

            <div className="pr-2">
              <button
                type="button"
                onClick={() => openTo("where")}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-brand text-brand-foreground hover:opacity-95 transition"
                aria-label="Open search"
              >
                <Search className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>

        {mounted && (
          <div className="fixed inset-0 z-[70]">
            <button
              type="button"
              onClick={close}
              aria-label="Close"
              className={cn(
                "absolute inset-0 bg-black/35 transition-opacity duration-200",
                entered ? "opacity-100" : "opacity-0"
              )}
            />

            <div
              className={cn(
                "absolute left-1/2 top-[140px] w-[min(860px,calc(100%-24px))] -translate-x-1/2 rounded-3xl bg-white shadow-elevated overflow-hidden transition-all duration-200",
                entered ? "opacity-100 translate-y-0 scale-100" : "opacity-0 translate-y-2 scale-95"
              )}
              role="dialog"
              aria-modal="true"
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200">
                <div className="flex w-full max-w-[620px] rounded-full border border-neutral-200 bg-white p-1">
                  <button
                    type="button"
                    onClick={() => setPanel("where")}
                    className={cn(
                      "flex-1 rounded-full px-4 py-2 text-sm font-semibold transition",
                      panel === "where" ? "bg-neutral-900 text-white" : "hover:bg-neutral-50"
                    )}
                  >
                    {draft.where.trim() ? draft.where.trim() : "Anywhere"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setPanel("when")}
                    className={cn(
                      "flex-1 rounded-full px-4 py-2 text-sm font-semibold transition",
                      panel === "when" ? "bg-neutral-900 text-white" : "hover:bg-neutral-50"
                    )}
                  >
                    {draft.start && draft.end
                      ? formatDateRange(draft.start, draft.end)
                      : "Any week"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setPanel("guests")}
                    className={cn(
                      "flex-1 rounded-full px-4 py-2 text-sm font-semibold transition",
                      panel === "guests" ? "bg-neutral-900 text-white" : "hover:bg-neutral-50"
                    )}
                  >
                    {draft.adults + draft.children > 0
                      ? `${draft.adults + draft.children} guests`
                      : "Add guests"}
                  </button>
                </div>

                <button
                  type="button"
                  onClick={close}
                  className="ml-4 inline-flex h-9 w-9 items-center justify-center rounded-full hover:bg-neutral-100 transition"
                  aria-label="Close"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="px-6 py-6">
                {panel === "where" && (
                  <div className="grid gap-5">
                    <div className="rounded-2xl border border-neutral-200 p-4">
                      <input
                        value={draft.where}
                        onChange={(e) => setDraft((d) => ({ ...d, where: e.target.value }))}
                        placeholder="Search destinations (e.g., Seoul, Busan, Jeju)"
                        className="w-full text-sm outline-none placeholder:text-neutral-400"
                        autoFocus
                      />
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {suggestions.map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => {
                            setDraft((d) => ({ ...d, where: s }));
                            setPanel("when");
                          }}
                          className="rounded-full border border-neutral-200 bg-white px-4 py-2 text-sm hover:bg-neutral-50 transition"
                        >
                          {s}
                        </button>
                      ))}
                      <button
                        type="button"
                        onClick={() => {
                          setDraft((d) => ({ ...d, where: "" }));
                          setPanel("when");
                        }}
                        className="rounded-full border border-neutral-200 bg-white px-4 py-2 text-sm hover:bg-neutral-50 transition text-neutral-600"
                      >
                        Anywhere
                      </button>
                    </div>
                  </div>
                )}

                {panel === "when" && (
                  <div className="grid gap-4">
                    <div className="rounded-2xl border border-neutral-200 p-4">
                      <div className="grid gap-3 sm:grid-cols-2">
                        <label className="grid gap-1">
                          <span className="text-xs text-neutral-600">Check-in</span>
                          <input
                            type="date"
                            value={draft.start}
                            onChange={(e) => {
                              const v = e.target.value;
                              setDraft((d) => {
                                const next = { ...d, start: v };
                                if (next.end && v && next.end < v) next.end = v;
                                return next;
                              });
                            }}
                            className="w-full rounded-xl border border-neutral-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand/20"
                          />
                        </label>
                        <label className="grid gap-1">
                          <span className="text-xs text-neutral-600">Check-out</span>
                          <input
                            type="date"
                            value={draft.end}
                            onChange={(e) => {
                              const v = e.target.value;
                              setDraft((d) => {
                                const next = { ...d, end: v };
                                if (next.start && v && v < next.start) next.start = v;
                                return next;
                              });
                            }}
                            className="w-full rounded-xl border border-neutral-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand/20"
                          />
                        </label>
                      </div>
                      <div className="mt-3 text-xs text-neutral-500">
                        Tip: native calendar is used for MVP.
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setPanel("guests")}
                      className="rounded-xl bg-neutral-900 px-4 py-3 text-sm font-semibold text-white hover:opacity-95 transition"
                    >
                      Next
                    </button>
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
                  className="text-sm font-semibold text-neutral-700 hover:text-neutral-900 transition"
                >
                  Clear all
                </button>

                <button
                  type="button"
                  onClick={applySearch}
                  className="inline-flex items-center gap-2 rounded-xl bg-brand px-5 py-3 text-sm font-semibold text-brand-foreground hover:opacity-95 transition"
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
            "inline-flex h-9 w-9 items-center justify-center rounded-full border transition",
            value <= 0
              ? "border-neutral-200 text-neutral-300"
              : "border-neutral-300 hover:bg-neutral-50"
          )}
          disabled={value <= 0}
          aria-label={`Decrease ${title}`}
        >
          <Minus className="h-4 w-4" />
        </button>

        <div className="w-8 text-center text-sm font-semibold">{value}</div>

        <button
          type="button"
          onClick={onInc}
          className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-neutral-300 hover:bg-neutral-50 transition"
          aria-label={`Increase ${title}`}
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
