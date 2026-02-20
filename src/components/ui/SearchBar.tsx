"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import type { DateRange } from "react-day-picker";
import WhereDropdown from "@/components/ui/searchbar/WhereDropdown";
import DateDropdown from "@/components/ui/searchbar/DateDropdown";
import GuestsDropdown from "@/components/ui/searchbar/GuestsDropdown";
import { cn } from "@/lib/utils";
import { useI18n } from "@/components/ui/LanguageProvider";

type Panel = "where" | "date" | "guests" | null;

function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}
function addDays(d: Date, days: number) {
  const x = new Date(d);
  x.setDate(x.getDate() + days);
  return x;
}
function toISODateLocal(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
function nightsBetween(from: Date, to: Date) {
  const a = startOfDay(from).getTime();
  const b = startOfDay(to).getTime();
  const n = Math.round((b - a) / (1000 * 60 * 60 * 24));
  return Math.max(1, n);
}

export default function SearchBar() {
  const router = useRouter();
  const sp = useSearchParams();
  const { t, locale } = useI18n();

  const wrapRef = useRef<HTMLDivElement | null>(null);
  const whereRef = useRef<HTMLButtonElement | null>(null);
  const dateRef = useRef<HTMLButtonElement | null>(null);
  const guestsRef = useRef<HTMLButtonElement | null>(null);

  const initial = useMemo(() => {
    const where = sp.get("where") ?? "";
    const adults = Number(sp.get("adults") ?? "2");
    const children = Number(sp.get("children") ?? "0");
    const start = sp.get("start");
    const end = sp.get("end");
    const rangeFromUrl: DateRange | undefined =
      start && end ? { from: new Date(`${start}T00:00:00`), to: new Date(`${end}T00:00:00`) } : undefined;

    return {
      where,
      adults: Number.isFinite(adults) ? adults : 2,
      children: Number.isFinite(children) ? children : 0,
      rangeFromUrl,
    };
  }, [sp]);

  const defaultRange = useMemo<DateRange>(() => {
    const today = startOfDay(new Date());
    return { from: today, to: addDays(today, 1) };
  }, []);

  const [where, setWhere] = useState(initial.where);
  const [range, setRange] = useState<DateRange | undefined>(initial.rangeFromUrl ?? defaultRange);
  const [adults, setAdults] = useState(Math.max(0, initial.adults));
  const [children, setChildren] = useState(Math.max(0, initial.children));

  const [open, setOpen] = useState<Panel>(null);
  const [entered, setEntered] = useState(false);

  const [pos, setPos] = useState<{ top: number; left: number; width: number } | null>(null);

  const totalGuests = Math.max(0, adults + children);

  const shortDateFormatter = useMemo(
    () => new Intl.DateTimeFormat(locale, { month: "short", day: "numeric" }),
    [locale]
  );
  const formatShort = useCallback((d: Date) => shortDateFormatter.format(d), [shortDateFormatter]);

  const dateLabel = useMemo(() => {
    const r = range ?? defaultRange;
    const from = r.from ?? defaultRange.from!;
    const to = r.to ?? defaultRange.to!;
    const n = nightsBetween(from, to);
    const nightWord = n === 1 ? t("night") : t("nights");
    return `${formatShort(from)} – ${formatShort(to)} (${n} ${nightWord})`;
  }, [range, defaultRange, formatShort, t]);

  const whereLabel = where.trim() ? where.trim() : t("where_to");
  const guestsLabel = `${t("guests")} ${totalGuests || 2}`;

  const desiredWidthFor = (p: Exclude<Panel, null>) => {
    if (p === "date") return 920;
    if (p === "where") return 560;
    return 440;
  };

  const getAnchorEl = (p: Exclude<Panel, null>) => {
    if (p === "where") return whereRef.current;
    if (p === "date") return dateRef.current;
    return guestsRef.current;
  };

  const measure = (p: Exclude<Panel, null>) => {
    const root = wrapRef.current;
    const anchor = getAnchorEl(p);
    if (!root || !anchor) return;

    const r = root.getBoundingClientRect();
    const a = anchor.getBoundingClientRect();

    const rootWidth = r.width;
    const desired = desiredWidthFor(p);
    const width = Math.min(desired, rootWidth);

    let left: number;
    if (p === "date") {
      left = Math.max(0, (rootWidth - width) / 2);
    } else {
      left = a.left - r.left;
      left = Math.max(0, Math.min(left, rootWidth - width));
    }

    const top = a.bottom - r.top + 10;
    setPos({ top, left, width });
  };

  const openPanel = (p: Exclude<Panel, null>) => {
    setOpen((cur) => (cur === p ? null : p));
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (!open) {
      queueMicrotask(() => {
        setEntered(false);
        setPos(null);
      });
      return;
    }
    measure(open);
    queueMicrotask(() => setEntered(false));
    const id = requestAnimationFrame(() => setEntered(true));

    const onResize = () => measure(open);
    window.addEventListener("resize", onResize);
    window.addEventListener("scroll", onResize, true);

    return () => {
      cancelAnimationFrame(id);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("scroll", onResize, true);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const runSearch = () => {
    const r = range ?? defaultRange;
    const from = r.from ?? defaultRange.from!;
    const to = r.to ?? defaultRange.to!;

    const params = new URLSearchParams();
    if (where.trim()) params.set("where", where.trim());
    params.set("start", toISODateLocal(from));
    params.set("end", toISODateLocal(to));
    params.set("adults", String(adults));
    params.set("children", String(children));
    params.set("guests", String(totalGuests || 2));

    router.push(`/browse?${params.toString()}`);
    setOpen(null);
  };

  const sectionBtn =
    "w-full sm:w-auto flex-1 rounded-2xl sm:rounded-full px-5 py-4 sm:py-3 text-left text-sm font-semibold text-neutral-900 transition hover:bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-neutral-200";

  const dividerV = <div className="hidden sm:block h-8 w-px bg-neutral-200" />;
  const dividerH = <div className="sm:hidden h-px bg-neutral-200" />;

  return (
    <div ref={wrapRef} className="mx-auto w-full max-w-[1200px] relative">
      <div className="relative z-10 rounded-2xl sm:rounded-full border border-neutral-200 bg-white shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center">
          <button
            ref={whereRef}
            type="button"
            onClick={() => openPanel("where")}
            className={cn(sectionBtn, open === "where" && "bg-neutral-50")}
          >
            {whereLabel}
          </button>

          {dividerV}{dividerH}

          <button
            ref={dateRef}
            type="button"
            onClick={() => openPanel("date")}
            className={cn(sectionBtn, open === "date" && "bg-neutral-50")}
          >
            <span suppressHydrationWarning>{dateLabel}</span>
          </button>

          {dividerV}{dividerH}

          <button
            ref={guestsRef}
            type="button"
            onClick={() => openPanel("guests")}
            className={cn(sectionBtn, open === "guests" && "bg-neutral-50")}
          >
            {guestsLabel}
          </button>

          <div className="p-2 sm:p-1">
            <button
              type="button"
              onClick={runSearch}
              className="w-full sm:w-12 h-12 inline-flex items-center justify-center gap-2 rounded-full bg-neutral-900 text-white hover:opacity-95 transition"
            >
              <Search className="h-5 w-5" />
              <span className="sm:hidden text-sm font-semibold">{t("search")}</span>
            </button>
          </div>
        </div>
      </div>

      {open && (
        <button type="button" onClick={() => setOpen(null)} className="fixed inset-0 z-40 bg-transparent" aria-label="Close" />
      )}

      {open && pos && (
        <div
          className={cn(
            "absolute z-[60] transition-all duration-200 ease-out",
            entered ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
          )}
          style={{ top: pos.top, left: pos.left, width: pos.width }}
        >
          {open === "where" && <WhereDropdown value={where} onSelect={setWhere} onClose={() => setOpen(null)} />}
          {open === "date" && <DateDropdown range={range ?? defaultRange} onChange={setRange} onClose={() => setOpen(null)} />}
          {open === "guests" && (
            <GuestsDropdown
              adults={adults}
              childCount={children}
              onChangeAdults={setAdults}
              onChangeChildren={setChildren}
              onClose={() => setOpen(null)}
            />
          )}
        </div>
      )}
    </div>
  );
}
