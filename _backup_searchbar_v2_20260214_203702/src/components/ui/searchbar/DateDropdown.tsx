"use client";

import { DayPicker } from "react-day-picker";
import type { DateRange } from "react-day-picker";
import { X } from "lucide-react";
import { useEffect, useState } from "react";

function addDays(d: Date, days: number) {
  const x = new Date(d);
  x.setDate(x.getDate() + days);
  return x;
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

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 640px)");
    const apply = () => setMonths(mq.matches ? 2 : 1);
    apply();
    mq.addEventListener?.("change", apply);
    return () => mq.removeEventListener?.("change", apply);
  }, []);

  return (
    <div className="w-full max-w-[920px] rounded-2xl border border-neutral-200 bg-white shadow-md">
      <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-100">
        <div className="text-sm font-semibold">언제 떠나시나요?</div>
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
        <div className="rounded-2xl border border-neutral-200 p-3">
          <DayPicker
            mode="range"
            selected={range}
            onSelect={onChange}
            numberOfMonths={months}
            showOutsideDays
          />
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-end gap-2">
          <button
            type="button"
            onClick={() => onChange(undefined)}
            className="rounded-xl border border-neutral-200 px-4 py-2 text-sm font-semibold hover:bg-neutral-50 transition"
          >
            초기화
          </button>
          <button
            type="button"
            onClick={() => {
              const today = new Date();
              onChange({ from: today, to: addDays(today, 1) });
            }}
            className="rounded-xl border border-neutral-200 px-4 py-2 text-sm font-semibold hover:bg-neutral-50 transition"
          >
            오늘~내일(1박)
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-neutral-900 px-4 py-2 text-sm font-semibold text-white hover:opacity-95 transition"
          >
            확인
          </button>
        </div>
      </div>
    </div>
  );
}
