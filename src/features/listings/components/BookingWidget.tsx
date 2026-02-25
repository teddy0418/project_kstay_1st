"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { DateRange } from "react-day-picker";
import { totalGuestPriceKRW } from "@/lib/policy";
import { formatKRW, nightsBetween, formatDateEn, addDays, parseISODate } from "@/lib/format";
import { useAuth } from "@/components/ui/AuthProvider";
import { useAuthModal } from "@/components/ui/AuthModalProvider";
import { useCurrency } from "@/components/ui/CurrencyProvider";
import { useExchangeRates } from "@/components/ui/ExchangeRatesProvider";
import { useI18n } from "@/components/ui/LanguageProvider";
import DateDropdown from "@/components/ui/searchbar/DateDropdown";
import GuestsDropdown from "@/components/ui/searchbar/GuestsDropdown";

function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}
function toISO(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
function freeCancelUntilKST(checkInDate: Date) {
  const deadline = addDays(checkInDate, -5);
  return `${formatDateEn(deadline)} 23:59 (KST)`;
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
  const router = useRouter();
  const { user } = useAuth();
  const { open: openAuthModal } = useAuthModal();
  const { currency } = useCurrency();
  const { formatFromKRW } = useExchangeRates();
  const { lang, t, locale } = useI18n();
  const today = useMemo(() => startOfDay(new Date()), []);
  const defaultRange = useMemo<DateRange>(
    () => ({ from: today, to: addDays(today, 1) }),
    [today]
  );

  const initialRange = useMemo((): DateRange => {
    if (defaultStart && defaultEnd) {
      const from = parseISODate(defaultStart);
      const to = parseISODate(defaultEnd);
      if (from.getTime() < to.getTime()) return { from, to };
    }
    return defaultRange;
  }, [defaultStart, defaultEnd, defaultRange]);

  const [range, setRange] = useState<DateRange | undefined>(initialRange);
  const [adults, setAdults] = useState(Math.max(1, defaultGuests ?? 2));
  const [childCount, setChildCount] = useState(0);
  const [openPanel, setOpenPanel] = useState<"date" | "guests" | null>(null);
  const [disabledRanges, setDisabledRanges] = useState<Array<{ from: string; to: string }>>([]);

  useEffect(() => {
    if (!listingId) return;
    fetch(`/api/listings/${encodeURIComponent(listingId)}/unavailable-dates`)
      .then((r) => r.json())
      .then((res) => {
        if (res?.data?.ranges) setDisabledRanges(res.data.ranges);
      })
      .catch(() => {});
  }, [listingId]);

  const dateRef = useRef<HTMLButtonElement>(null);
  const guestsRef = useRef<HTMLButtonElement>(null);

  const totalGuests = Math.max(0, adults + childCount);
  const effectiveRange = useMemo(() => {
    if (range?.from) {
      const to = range.to && range.to > range.from ? range.to : addDays(range.from, 1);
      return { from: range.from, to };
    }
    return { from: today, to: addDays(today, 1) };
  }, [range, today]);
  const nights = useMemo(
    () => nightsBetween(effectiveRange.from, effectiveRange.to),
    [effectiveRange.from, effectiveRange.to]
  );
  const checkInISO = toISO(effectiveRange.from);
  const checkOutISO = toISO(effectiveRange.to);

  const overlapsDisabled = useMemo(() => {
    if (disabledRanges.length === 0) return false;
    return disabledRanges.some((r) => checkInISO < r.to && checkOutISO > r.from);
  }, [disabledRanges, checkInISO, checkOutISO]);

  const nightlyAllInKRW = totalGuestPriceKRW(basePricePerNightKRW);
  const totalKRW = nightlyAllInKRW * nights;
  const totalDual = { main: formatFromKRW(totalKRW, currency), approxKRW: formatKRW(totalKRW) };
  const nightlyDual = { main: formatFromKRW(nightlyAllInKRW, currency), approxKRW: formatKRW(nightlyAllInKRW) };
  const cancelText = freeCancelUntilKST(effectiveRange.from);

  const shortDateFormatter = useMemo(
    () => new Intl.DateTimeFormat(locale, { month: "short", day: "numeric" }),
    [locale]
  );
  const formatShort = useCallback((d: Date) => shortDateFormatter.format(d), [shortDateFormatter]);
  const dateLabel = useMemo(() => {
    const n = nights;
    const nightWord = n === 1 ? t("night") : t("nights");
    return `${formatShort(effectiveRange.from)} – ${formatShort(effectiveRange.to)} (${n} ${nightWord})`;
  }, [effectiveRange, formatShort, nights, t]);
  const guestsLabel = `${t("guests")} ${totalGuests || 2}`;

  const reserve = () => {
    if (overlapsDisabled) {
      alert(
        lang === "ko"
          ? "선택한 날짜는 이미 예약되어 있습니다. 다른 날짜를 선택해 주세요."
          : "Selected dates are not available. Please choose different dates."
      );
      return;
    }
    const params = new URLSearchParams();
    params.set("listingId", String(listingId));
    params.set("start", checkInISO);
    params.set("end", checkOutISO);
    params.set("guests", String(totalGuests));
    const checkoutUrl = `/checkout?${params.toString()}`;

    if (!user) {
      openAuthModal({ next: checkoutUrl, role: "GUEST" });
      return;
    }
    router.push(checkoutUrl);
  };

  const c =
    lang === "ko"
      ? {
          total: "총 결제금액",
          included: "세금/서비스 요금 포함 · (약 {approx})",
          perNight: "1박 기준",
          freeCancel: "무료 취소 가능 기한",
          reserve: "예약하기",
          notCharged: "아직 결제되지 않습니다. (MVP)",
        }
      : lang === "ja"
        ? {
            total: "合計金額",
            included: "税・サービス料込み · (約 {approx})",
            perNight: "1泊あたり",
            freeCancel: "無料キャンセル期限",
            reserve: "予約する",
            notCharged: "まだ課金されません。(MVP)",
          }
        : lang === "zh"
          ? {
              total: "总金额",
              included: "含税及服务费 · (约 {approx})",
              perNight: "每晚",
              freeCancel: "免费取消截止",
              reserve: "预订",
              notCharged: "目前不会扣款。(MVP)",
            }
          : {
              total: "Total",
              included: "Tax & service fee included · (≈ {approx})",
              perNight: "per night",
              freeCancel: "Free cancellation until",
              reserve: "Reserve",
              notCharged: "You won't be charged yet. (MVP)",
            };

  return (
    <div className="relative rounded-2xl border border-neutral-200 bg-white p-5 shadow-md">
      <div className="flex items-end justify-between">
        <div>
          <div className="text-xs text-neutral-500">{c.total}</div>
          <div className="mt-1 text-2xl font-semibold text-neutral-900">{totalDual.main}</div>
          <div className="mt-1 text-xs text-neutral-500">
            {c.included.replace("{approx}", totalDual.approxKRW)}
          </div>
        </div>
        <div className="text-right text-xs text-neutral-500">
          <div className="font-semibold text-neutral-900">{nightlyDual.main}</div>
          <div>{c.perNight}</div>
        </div>
      </div>

      <div className="mt-4 overflow-hidden rounded-2xl border border-neutral-200">
        <div className="flex flex-col">
          <button
            ref={dateRef}
            type="button"
            onClick={() => setOpenPanel((p) => (p === "date" ? null : "date"))}
            className="flex w-full items-center justify-between border-b border-neutral-200 px-4 py-3 text-left text-sm font-semibold text-neutral-900 hover:bg-neutral-50 transition"
          >
            <span suppressHydrationWarning>{dateLabel}</span>
          </button>
          <button
            ref={guestsRef}
            type="button"
            onClick={() => setOpenPanel((p) => (p === "guests" ? null : "guests"))}
            className="flex w-full items-center justify-between px-4 py-3 text-left text-sm font-semibold text-neutral-900 hover:bg-neutral-50 transition"
          >
            {guestsLabel}
          </button>
          {openPanel === "date" && (
            <div className="border-t border-neutral-200 p-3">
              <DateDropdown
                range={range}
                onChange={setRange}
                onClose={() => setOpenPanel(null)}
                numberOfMonths={1}
                disabledRanges={disabledRanges}
              />
            </div>
          )}
          {openPanel === "guests" && (
            <div className="border-t border-neutral-200 p-3">
              <GuestsDropdown
                adults={adults}
                childCount={childCount}
                onChangeAdults={(n) => setAdults(Math.max(0, Math.min(16, n)))}
                onChangeChildren={(n) => setChildCount(Math.max(0, Math.min(16, n)))}
                onClose={() => setOpenPanel(null)}
              />
            </div>
          )}
        </div>
      </div>

      <div className="mt-3 rounded-xl bg-neutral-50 px-3 py-2 text-xs text-neutral-700">
        {c.freeCancel} <span className="font-semibold">{cancelText}</span>
      </div>

      <button
        type="button"
        onClick={reserve}
        disabled={overlapsDisabled}
        className="mt-4 w-full rounded-full bg-neutral-900 py-3 text-sm font-semibold text-white hover:opacity-95 transition disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {c.reserve}
      </button>
      <div className="mt-2 text-center text-xs text-neutral-500">
        {c.notCharged}
      </div>
    </div>
  );
}
