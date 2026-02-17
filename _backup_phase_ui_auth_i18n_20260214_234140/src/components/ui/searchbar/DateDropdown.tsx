"use client";

import { DayPicker } from "react-day-picker";
import type { DateRange } from "react-day-picker";
import { X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

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

function nightsBetween(from: Date, to: Date) {
  const a = startOfDay(from).getTime();
  const b = startOfDay(to).getTime();
  const n = Math.round((b - a) / (1000 * 60 * 60 * 24));
  return Math.max(1, n);
}

function formatFull(d: Date) {
  const date = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(d);
  const wd = new Intl.DateTimeFormat("en-US", { weekday: "short" }).format(d);
  return `${date} (${wd})`;
}

export default function DateDropdown({
  range,
  onChange,
  onClose,
}: {
  range: DateRange | undefined;
  onChange: (r: DateRange | undefined) => void;
  onClose: () => void;
}) {
  const [months, setMonths] = useState(1);

  const today = useMemo(() => startOfDay(new Date()), []);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 640px)");
    const apply = () => setMonths(mq.matches ? 2 : 1);
    apply();
    mq.addEventListener?.("change", apply);
    return () => mq.removeEventListener?.("change", apply);
  }, []);

  const summary = useMemo(() => {
    if (range?.from && range?.to) {
      const n = nightsBetween(range.from, range.to);
      return `${formatFull(range.from)} → ${formatFull(range.to)} · ${n} ${n === 1 ? "night" : "nights"}`;
    }
    return "Select your dates";
  }, [range]);

  return (
    <div className="w-full rounded-2xl border border-neutral-200 bg-white shadow-md">
      <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-100">
        <div className="text-sm font-semibold">When are you traveling?</div>
        <button
          type="button"
          onClick={onClose}
          className="inline-flex h-9 w-9 items-center justify-center rounded-full hover:bg-neutral-100 transition"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="p-4">
        <div className="mb-3 text-sm text-neutral-700">
          <span className="font-semibold">Selected:</span> {summary}
        </div>

        <div className="rounded-2xl border border-neutral-200 p-3">
          <DayPicker
            mode="range"
            selected={range}
            onSelect={onChange}
            numberOfMonths={months}
            showOutsideDays
            fromDate={today}
            disabled={{ before: today }}
          />
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-end gap-2">
          <button
            type="button"
            onClick={() => onChange(undefined)}
            className="rounded-xl border border-neutral-200 px-4 py-2 text-sm font-semibold hover:bg-neutral-50 transition"
          >
            Clear
          </button>

          <button
            type="button"
            onClick={() => onChange({ from: today, to: addDays(today, 1) })}
            className="rounded-xl border border-neutral-200 px-4 py-2 text-sm font-semibold hover:bg-neutral-50 transition"
          >
            Today → Tomorrow (1 night)
          </button>

          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-neutral-900 px-4 py-2 text-sm font-semibold text-white hover:opacity-95 transition"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
