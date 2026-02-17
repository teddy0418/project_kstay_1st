"use client";

import { useMemo, useState } from "react";
import { Minus, Plus } from "lucide-react";
import { diffNights, formatKRW } from "@/lib/format";
import {
  calcGuestServiceFeeKRW,
  totalGuestPriceKRW,
  FREE_CANCELLATION_DAYS,
  formatKSTDateTimeFromUtcMs,
  freeCancellationDeadlineUtcMs,
} from "@/lib/policy";
import { formatDualPriceFromKRW } from "@/lib/currency";
import { useCurrency } from "@/components/ui/CurrencyProvider";

function clamp(n: number) {
  return Math.min(16, Math.max(1, n));
}

export default function BookingWidget({
  listingId,
  basePricePerNightKRW,
  defaultStart,
  defaultEnd,
  defaultGuests,
}: {
  listingId: string;
  basePricePerNightKRW: number;
  defaultStart?: string;
  defaultEnd?: string;
  defaultGuests?: number;
}) {
  const { currency } = useCurrency();
  const [start, setStart] = useState(defaultStart ?? "");
  const [end, setEnd] = useState(defaultEnd ?? "");
  const [guests, setGuests] = useState(clamp(defaultGuests ?? 1));

  const nights = useMemo(() => diffNights(start, end), [start, end]);

  const allInPerNightKRW = totalGuestPriceKRW(basePricePerNightKRW);
  const perNightDual = formatDualPriceFromKRW(allInPerNightKRW, currency);

  const baseTotalKRW = nights > 0 ? basePricePerNightKRW * nights : basePricePerNightKRW;
  const feeKRW = calcGuestServiceFeeKRW(baseTotalKRW);
  const totalKRW = baseTotalKRW + feeKRW;

  const totalDual = formatDualPriceFromKRW(totalKRW, currency);

  const cancelDeadlineLabel = start
    ? formatKSTDateTimeFromUtcMs(freeCancellationDeadlineUtcMs(start))
    : null;

  const canContinue = Boolean(start && end && nights > 0);

  return (
    <aside className="h-fit rounded-2xl border border-neutral-200 p-6 shadow-soft">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-xl font-semibold">
            {perNightDual.main}
            <span className="text-sm font-normal text-neutral-600"> / night</span>
          </div>
          <div className="text-xs text-neutral-500">
            ≈ {perNightDual.approxKRW} · Tax & Service Fee Included
          </div>
        </div>

        <div className="rounded-full bg-neutral-900 px-3 py-1 text-xs font-semibold text-white">
          Best Value <span className="opacity-70">(0% Host Fee)</span>
        </div>
      </div>

      <div className="mt-4 grid gap-3 rounded-2xl border border-neutral-200 p-4">
        <label className="grid gap-1">
          <span className="text-xs font-semibold text-neutral-600">Check-in</span>
          <input
            type="date"
            value={start}
            onChange={(e) => {
              const v = e.target.value;
              setStart(v);
              if (end && v && end < v) setEnd(v);
            }}
            className="w-full rounded-xl border border-neutral-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand/20"
          />
        </label>

        <label className="grid gap-1">
          <span className="text-xs font-semibold text-neutral-600">Check-out</span>
          <input
            type="date"
            value={end}
            onChange={(e) => {
              const v = e.target.value;
              setEnd(v);
              if (start && v && v < start) setStart(v);
            }}
            className="w-full rounded-xl border border-neutral-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand/20"
          />
        </label>

        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-neutral-600">Guests</div>
            <div className="text-sm font-medium">
              {guests} {guests === 1 ? "guest" : "guests"}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setGuests((g) => clamp(g - 1))}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-neutral-200 hover:bg-neutral-50"
              aria-label="Decrease guests"
            >
              <Minus className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setGuests((g) => clamp(g + 1))}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-neutral-200 hover:bg-neutral-50"
              aria-label="Increase guests"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {cancelDeadlineLabel && (
        <div className="mt-3 rounded-2xl border border-neutral-200 p-4 text-sm">
          <div className="font-semibold">Free cancellation</div>
          <div className="mt-1 text-neutral-700">
            Free cancellation until <span className="font-semibold">{cancelDeadlineLabel}</span>
          </div>
          <div className="mt-1 text-xs text-neutral-500">
            Rule: {FREE_CANCELLATION_DAYS} days before check-in (Korea Time).
          </div>
        </div>
      )}

      <div className="mt-4 rounded-2xl border border-neutral-200 p-4 text-sm">
        <div className="flex justify-between">
          <span className="text-neutral-600">Base</span>
          <span className="text-neutral-900">{formatKRW(baseTotalKRW)}</span>
        </div>
        <div className="flex justify-between mt-1">
          <span className="text-neutral-600">Guest service fee (10%)</span>
          <span className="text-neutral-900">{formatKRW(feeKRW)}</span>
        </div>
        <div className="h-px bg-neutral-200 my-3" />
        <div className="flex justify-between font-semibold">
          <span>Total</span>
          <span>
            {totalDual.main}{" "}
            <span className="text-xs font-normal text-neutral-500">
              (≈ {totalDual.approxKRW})
            </span>
          </span>
        </div>
      </div>

      <a
        href={
          canContinue
            ? `/checkout?listingId=${encodeURIComponent(listingId)}&start=${encodeURIComponent(start)}&end=${encodeURIComponent(end)}&guests=${guests}`
            : "#"
        }
        className={`mt-4 block w-full rounded-xl px-4 py-3 text-center text-sm font-semibold ${
          canContinue
            ? "bg-brand text-brand-foreground hover:opacity-95"
            : "bg-neutral-200 text-neutral-500 pointer-events-none"
        }`}
      >
        Continue to payment
      </a>

      <p className="mt-3 text-xs text-neutral-500">
        MVP payment flow: Pay now → host can decline within 24 hours → automatic void/refund.
      </p>
    </aside>
  );
}
