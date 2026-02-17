"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import type { DateRange } from "react-day-picker";
import WhereDropdown from "@/components/ui/searchbar/WhereDropdown";
import DateDropdown from "@/components/ui/searchbar/DateDropdown";
import GuestsDropdown from "@/components/ui/searchbar/GuestsDropdown";
import { cn } from "@/lib/utils";

type Panel = "where" | "date" | "guests" | null;

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function toISODateLocal(d: Date) {
  const y = d.getFullYear();
  const m = pad2(d.getMonth() + 1);
  const day = pad2(d.getDate());
  return `${y}-${m}-${day}`;
}

function addDays(d: Date, days: number) {
  const x = new Date(d);
  x.setDate(x.getDate() + days);
  return x;
}

function formatMMDD(d: Date) {
  return `${pad2(d.getMonth() + 1)}.${pad2(d.getDate())}`;
}

export default function SearchBar() {
  const router = useRouter();
  const sp = useSearchParams();
  const wrapRef = useRef<HTMLDivElement | null>(null);

  const initial = useMemo(() => {
    const where = sp.get("where") ?? "";
    const adults = Number(sp.get("adults") ?? "2");
    const children = Number(sp.get("children") ?? "0");

    const start = sp.get("start");
    const end = sp.get("end");
    const range: DateRange | undefined =
      start && end
        ? {
            from: new Date(`${start}T00:00:00`),
            to: new Date(`${end}T00:00:00`),
          }
        : undefined;

    return {
      where,
      adults: Number.isFinite(adults) ? adults : 2,
      children: Number.isFinite(children) ? children : 0,
      range,
    };
  }, [sp]);

  const [where, setWhere] = useState(initial.where);
  const [range, setRange] = useState<DateRange | undefined>(initial.range);
  const [adults, setAdults] = useState(Math.max(0, initial.adults));
  const [children, setChildren] = useState(Math.max(0, initial.children));

  const [open, setOpen] = useState<Panel>(null);
  const [entered, setEntered] = useState(false);

  const totalGuests = Math.max(0, adults + children);

  const dateLabel = useMemo(() => {
    if (range?.from && range?.to) {
      return `${formatMMDD(range.from)} ~ ${formatMMDD(range.to)}`;
    }
    return "현재 날짜로부터 1박";
  }, [range]);

  useEffect(() => {
    if (!open) return;
    setEntered(false);
    const id = requestAnimationFrame(() => setEntered(true));
    return () => cancelAnimationFrame(id);
  }, [open]);

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      const t = e.target as Node;
      if (wrapRef.current && !wrapRef.current.contains(t)) setOpen(null);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(null);
    };
    document.addEventListener("mousedown", onDown);
    window.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      window.removeEventListener("keydown", onKey);
    };
  }, []);

  const toggle = (p: Exclude<Panel, null>) => {
    setOpen((cur) => (cur === p ? null : p));
  };

  const runSearch = () => {
    const from = range?.from ?? new Date();
    const to = range?.to ?? addDays(from, 1);

    const params = new URLSearchParams();
    if (where.trim()) params.set("where", where.trim());
    params.set("start", toISODateLocal(from));
    params.set("end", toISODateLocal(to));
    params.set("adults", String(adults));
    params.set("children", String(children));
    params.set("guests", String(totalGuests));

    router.push(`/browse?${params.toString()}`);
    setOpen(null);
  };

  const sectionBtn =
    "w-full sm:w-auto flex-1 rounded-2xl sm:rounded-full px-5 py-4 sm:py-3 text-left text-sm font-semibold text-neutral-900 transition hover:bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-neutral-200";

  const dividerV = <div className="hidden sm:block h-8 w-px bg-neutral-200" />;
  const dividerH = <div className="sm:hidden h-px bg-neutral-200" />;

  return (
    <div ref={wrapRef} className="mx-auto w-full max-w-[1200px]">
      <div className="relative">
        <div className="rounded-2xl sm:rounded-full border border-neutral-200 bg-white shadow-md">
          <div className="flex flex-col sm:flex-row sm:items-center">
            <button
              type="button"
              onClick={() => toggle("where")}
              className={cn(sectionBtn, open === "where" && "bg-neutral-50")}
              aria-label="Destination"
            >
              {where ? where : "어디로 갈까요?"}
            </button>

            {dividerV}
            {dividerH}

            <button
              type="button"
              onClick={() => toggle("date")}
              className={cn(sectionBtn, open === "date" && "bg-neutral-50")}
              aria-label="Dates"
            >
              {dateLabel}
            </button>

            {dividerV}
            {dividerH}

            <button
              type="button"
              onClick={() => toggle("guests")}
              className={cn(sectionBtn, open === "guests" && "bg-neutral-50")}
              aria-label="Guests"
            >
              인원 {totalGuests || 2}
            </button>

            <div className="p-2 sm:p-1">
              <button
                type="button"
                onClick={runSearch}
                className="w-full sm:w-12 h-12 inline-flex items-center justify-center gap-2 rounded-full bg-neutral-900 text-white hover:opacity-95 transition"
                aria-label="Search"
              >
                <Search className="h-5 w-5" />
                <span className="sm:hidden text-sm font-semibold">검색</span>
              </button>
            </div>
          </div>
        </div>

        {open && (
          <button
            type="button"
            onClick={() => setOpen(null)}
            className={cn(
              "fixed inset-0 z-40 bg-black/10 transition-opacity duration-200",
              entered ? "opacity-100" : "opacity-0"
            )}
            aria-label="Close popover"
          />
        )}

        {open && (
          <div
            className={cn(
              "absolute left-0 right-0 top-full mt-3 z-50 flex justify-center transition-all duration-200",
              entered ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
            )}
          >
            {open === "where" && (
              <WhereDropdown
                value={where}
                onSelect={setWhere}
                onClose={() => setOpen(null)}
              />
            )}
            {open === "date" && (
              <DateDropdown
                range={range}
                onChange={setRange}
                onClose={() => setOpen(null)}
              />
            )}
            {open === "guests" && (
              <GuestsDropdown
                adults={adults}
                children={children}
                onChangeAdults={setAdults}
                onChangeChildren={setChildren}
                onClose={() => setOpen(null)}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
