"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { DateRange } from "react-day-picker";
import { totalGuestPriceKRW, NON_REFUNDABLE_DISCOUNT_RATE } from "@/lib/policy";
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
  nonRefundableSpecialEnabled = false,
  defaultStart,
  defaultEnd,
  defaultGuests,
}: {
  listingId: string;
  basePricePerNightKRW: number;
  /** 호스트가 환불 불가 특가 옵션을 켠 경우에만 true. 게스트에게 특가 선택 UI 노출 */
  nonRefundableSpecialEnabled?: boolean;
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
  const [isNonRefundableSpecial, setIsNonRefundableSpecial] = useState(false);
  const [disabledRanges, setDisabledRanges] = useState<Array<{ from: string; to: string }>>([]);
  const [bookedRanges, setBookedRanges] = useState<Array<{ from: string; to: string }>>([]);
  const [blockedRanges, setBlockedRanges] = useState<Array<{ from: string; to: string }>>([]);

  useEffect(() => {
    if (!listingId) return;
    fetch(`/api/listings/${encodeURIComponent(listingId)}/unavailable-dates`, { cache: "no-store" })
      .then((r) => r.json())
      .then((res) => {
        const data = res?.data;
        if (data?.ranges) setDisabledRanges(data.ranges);
        if (data?.bookedRanges) setBookedRanges(data.bookedRanges);
        if (data?.blockedRanges) setBlockedRanges(data.blockedRanges ?? []);
      })
      .catch(() => {});
  }, [listingId]);

  const cardRef = useRef<HTMLDivElement>(null);
  const priceRef = useRef<HTMLDivElement>(null);
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

  const basePerNightKRW =
    nonRefundableSpecialEnabled && isNonRefundableSpecial
      ? Math.round(basePricePerNightKRW * (1 - NON_REFUNDABLE_DISCOUNT_RATE))
      : basePricePerNightKRW;
  const nightlyAllInKRW = totalGuestPriceKRW(basePerNightKRW);
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
      alert(t("dates_unavailable"));
      return;
    }
    const params = new URLSearchParams();
    params.set("listingId", String(listingId));
    params.set("start", checkInISO);
    params.set("end", checkOutISO);
    params.set("guests", String(totalGuests));
    if (nonRefundableSpecialEnabled && isNonRefundableSpecial) params.set("special", "1");
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
          specialTitle: "할인 특가",
          specialBenefit: "10% 할인으로 더 저렴하게 예약",
          specialCondition: "예약 후 24시간이 지나면 취소 시 환불이 불가능해요.",
        }
      : lang === "ja"
        ? {
            total: "合計金額",
            included: "税・サービス料込み · (約 {approx})",
            perNight: "1泊あたり",
            freeCancel: "無料キャンセル期限",
            reserve: "予約する",
            notCharged: "まだ課金されません。(MVP)",
            specialTitle: "割引特価",
            specialBenefit: "10%割引でお得に予約",
            specialCondition: "予約から24時間を過ぎると、キャンセル時の返金はできません。",
          }
        : lang === "zh"
          ? {
              total: "总金额",
              included: "含税及服务费 · (约 {approx})",
              perNight: "每晚",
              freeCancel: "免费取消截止",
              reserve: "预订",
              notCharged: "目前不会扣款。(MVP)",
              specialTitle: "特价优惠",
              specialBenefit: "享9折优惠预订",
              specialCondition: "预订后超过24小时取消将不可退款。",
            }
          : {
              total: "Total",
              included: "Tax & service fee included · (≈ {approx})",
              perNight: "per night",
              freeCancel: "Free cancellation until",
              reserve: "Reserve",
              notCharged: "You won't be charged yet. (MVP)",
              specialTitle: "Discount rate",
              specialBenefit: "Save 10% on this stay",
              specialCondition: "No refund if you cancel after 24 hours from booking.",
            };

  return (
    <div
      ref={cardRef}
      className="booking-widget-se relative mx-auto w-full max-w-[375px] sm:max-w-[420px] md:max-w-[440px] rounded-2xl border border-neutral-200 bg-white p-5 shadow-md"
    >
      <div ref={priceRef} className="booking-widget-price-block flex items-end justify-between">
        <div>
          <div className="text-xs text-neutral-500">{c.total}</div>
          <div className="booking-widget-total mt-1 text-2xl font-semibold text-neutral-900">{totalDual.main}</div>
          <div className="mt-1 text-xs text-neutral-500">
            {c.included.replace("{approx}", totalDual.approxKRW)}
          </div>
        </div>
        <div className="text-right text-xs text-neutral-500">
          <div className="font-semibold text-neutral-900">{nightlyDual.main}</div>
          <div>{c.perNight}</div>
        </div>
      </div>

      <div className="booking-widget-date-box mt-4 overflow-hidden rounded-2xl border border-neutral-200">
        <div className="flex flex-col">
          <button
            ref={dateRef}
            type="button"
            onClick={() => setOpenPanel((p) => (p === "date" ? null : "date"))}
            className="booking-widget-row flex w-full items-center justify-between border-b border-neutral-200 px-4 py-3 text-left text-sm font-semibold text-neutral-900 hover:bg-neutral-50 transition"
          >
            <span suppressHydrationWarning>{dateLabel}</span>
          </button>
          <button
            ref={guestsRef}
            type="button"
            onClick={() => setOpenPanel((p) => (p === "guests" ? null : "guests"))}
            className="booking-widget-row flex w-full items-center justify-between px-4 py-3 text-left text-sm font-semibold text-neutral-900 hover:bg-neutral-50 transition"
          >
            {guestsLabel}
          </button>
          {openPanel === "date" && (
            <DateDropdown
              range={range}
              onChange={setRange}
              onClose={() => setOpenPanel(null)}
              overlay
              anchorRef={priceRef}
              bookingCardRef={cardRef}
              disabledRanges={disabledRanges}
              bookedRanges={bookedRanges}
              blockedRanges={blockedRanges}
              listingId={listingId}
              basePricePerNightKRW={basePricePerNightKRW}
            />
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

      <div className="booking-widget-free-cancel mt-3 rounded-xl bg-neutral-50 px-3 py-2 text-xs text-neutral-700">
        {c.freeCancel} <span className="font-semibold">{cancelText}</span>
      </div>

      {nonRefundableSpecialEnabled && (
        <label className="mt-3 flex cursor-pointer items-start gap-3 rounded-xl border border-amber-200 bg-gradient-to-br from-amber-50 to-amber-50/50 px-3 py-3 sm:px-4 sm:py-3.5 min-w-0">
          <input
            type="checkbox"
            checked={isNonRefundableSpecial}
            onChange={(e) => setIsNonRefundableSpecial(e.target.checked)}
            className="mt-0.5 sm:mt-1 h-5 w-5 shrink-0 rounded border-2 border-amber-400 text-amber-600 focus:ring-2 focus:ring-amber-500 focus:ring-offset-1"
            aria-describedby="special-benefit special-condition"
          />
          <div className="flex-1 min-w-0 space-y-1 sm:space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-bold text-amber-900 text-sm sm:text-base">{c.specialTitle}</span>
              <span className="rounded-full bg-amber-200/80 px-2 py-0.5 text-[10px] sm:text-xs font-semibold text-amber-900">
                {lang === "ko" ? "10% 할인" : lang === "ja" ? "10%OFF" : lang === "zh" ? "9折" : "10% off"}
              </span>
            </div>
            <p id="special-benefit" className="text-xs sm:text-sm font-medium text-amber-800 leading-snug">
              {c.specialBenefit}
            </p>
            <p id="special-condition" className="text-[11px] sm:text-xs text-amber-700/90 leading-snug">
              {c.specialCondition}
            </p>
          </div>
        </label>
      )}

      <button
        type="button"
        onClick={reserve}
        disabled={overlapsDisabled}
        title={overlapsDisabled ? t("dates_unavailable") : undefined}
        className="booking-widget-reserve-btn mt-4 w-full rounded-full bg-neutral-900 py-3 text-sm font-semibold text-white hover:opacity-95 transition disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {c.reserve}
      </button>
      <div className="booking-widget-not-charged mt-2 text-center text-xs text-neutral-500">
        {c.notCharged}
      </div>
    </div>
  );
}
