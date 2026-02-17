"use client";

import { Minus, Plus, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useI18n } from "@/components/ui/LanguageProvider";

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

function Row({
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
      <div className="min-w-0">
        <div className="text-sm font-semibold">{title}</div>
        <div className="text-xs text-neutral-500">{subtitle}</div>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onDec}
          disabled={value <= 0}
          className={cn(
            "inline-flex h-9 w-9 items-center justify-center rounded-full border transition",
            value <= 0 ? "border-neutral-200 text-neutral-300" : "border-neutral-300 hover:bg-neutral-50"
          )}
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

export default function GuestsDropdown({
  adults,
  childCount,
  onChangeAdults,
  onChangeChildren,
  onClose,
}: {
  adults: number;
  childCount: number;
  onChangeAdults: (n: number) => void;
  onChangeChildren: (n: number) => void;
  onClose: () => void;
}) {
  const { t } = useI18n();
  const total = Math.max(0, adults + childCount);

  return (
    <div className="w-full rounded-2xl border border-neutral-200 bg-white shadow-md">
      <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-100">
        <div className="text-sm font-semibold">{t("guests")}</div>
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
        <div className="grid gap-4">
          <Row
            title="Adults"
            subtitle="Ages 13+"
            value={adults}
            onDec={() => onChangeAdults(clamp(adults - 1, 0, 16))}
            onInc={() => onChangeAdults(clamp(adults + 1, 0, 16))}
          />
          <div className="h-px bg-neutral-200" />
          <Row
            title="Children"
            subtitle="Ages 0–12"
            value={childCount}
            onDec={() => onChangeChildren(clamp(childCount - 1, 0, 16))}
            onInc={() => onChangeChildren(clamp(childCount + 1, 0, 16))}
          />
        </div>

        <div className="mt-4 flex items-center justify-between">
          <div className="text-sm text-neutral-600">
            Total <span className="font-semibold text-neutral-900">{total}</span>
          </div>

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
