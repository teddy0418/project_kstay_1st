"use client";

import { DayPicker } from "react-day-picker";
import type { DateRange } from "react-day-picker";
import { X } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useI18n } from "@/components/ui/LanguageProvider";
import { nightsBetween, addDays } from "@/lib/format";

function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

export default function DateDropdown({
  range,
  onChange,
  onClose,
  numberOfMonths: numberOfMonthsProp,
}: {
  range: DateRange | undefined;
  onChange: (r: DateRange | undefined) => void;
  onClose: () => void;
  /** 좁은 영역(예: 상세 예약 위젯)에서는 1로 지정해 한 달만 표시 */
  numberOfMonths?: number;
}) {
  const { t, locale } = useI18n();
  const [monthsResponsive, setMonthsResponsive] = useState(1);
  const today = useMemo(() => startOfDay(new Date()), []);
  const months = numberOfMonthsProp ?? monthsResponsive;

  useEffect(() => {
    if (numberOfMonthsProp != null) return;
    const mq = window.matchMedia("(min-width: 640px)");
    const apply = () => setMonthsResponsive(mq.matches ? 2 : 1);
    apply();
    mq.addEventListener?.("change", apply);
    return () => mq.removeEventListener?.("change", apply);
  }, [numberOfMonthsProp]);

  const fullDateFormatter = useMemo(
    () => new Intl.DateTimeFormat(locale, { month: "short", day: "numeric", year: "numeric" }),
    [locale]
  );
  const weekdayFormatter = useMemo(() => new Intl.DateTimeFormat(locale, { weekday: "short" }), [locale]);

  const formatFull = useCallback((d: Date) => {
    const date = fullDateFormatter.format(d);
    const wd = weekdayFormatter.format(d);
    return `${date} (${wd})`;
  }, [fullDateFormatter, weekdayFormatter]);

  const summary = useMemo(() => {
    if (range?.from && range?.to) {
      const n = Math.max(1, nightsBetween(range.from, range.to));
      const nightWord = n === 1 ? t("night") : t("nights");
      return `${formatFull(range.from)} → ${formatFull(range.to)} · ${n} ${nightWord}`;
    }
    return "Select your dates";
  }, [range, formatFull, t]);

  return (
    <div className="w-max max-w-full rounded-2xl border border-neutral-200 bg-white shadow-md">
      <div className="flex items-center justify-between px-3 py-2 border-b border-neutral-100">
        <div className="text-sm font-semibold">{t("when_traveling")}</div>
        <button
          type="button"
          onClick={onClose}
          className="inline-flex h-9 w-9 items-center justify-center rounded-full hover:bg-neutral-100 transition"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="p-3">
        <div className="mb-2 text-sm text-neutral-700">
          <span className="font-semibold">{t("selected")}:</span> {summary}
        </div>

        <div className="w-max max-w-full mx-auto overflow-x-auto rounded-2xl border border-neutral-200 p-2">
          <DayPicker
            mode="range"
            selected={range}
            onSelect={onChange}
            numberOfMonths={months}
            showOutsideDays
            fromDate={today}
            disabled={{ before: today }}
            className="rdp-compact"
          />
        </div>

        <div className="mt-3 flex flex-wrap items-center justify-end gap-2">
          <button
            type="button"
            onClick={() => onChange(undefined)}
            className="rounded-xl border border-neutral-200 px-4 py-2 text-sm font-semibold hover:bg-neutral-50 transition"
          >
            {t("clear")}
          </button>

          <button
            type="button"
            onClick={() => onChange({ from: today, to: addDays(today, 1) })}
            className="rounded-xl border border-neutral-200 px-4 py-2 text-sm font-semibold hover:bg-neutral-50 transition"
          >
            {t("today_tomorrow")}
          </button>

          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-neutral-900 px-4 py-2 text-sm font-semibold text-white hover:opacity-95 transition"
          >
            {t("done")}
          </button>
        </div>
      </div>
    </div>
  );
}
