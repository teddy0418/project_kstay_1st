"use client";

import type { RefObject } from "react";
import { createPortal } from "react-dom";
import { DayPicker } from "react-day-picker";
import type { DateRange } from "react-day-picker";
import { enUS, ko, ja, zhCN } from "react-day-picker/locale";
import { Calendar, X } from "lucide-react";
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useCurrency } from "@/components/ui/CurrencyProvider";
import { useExchangeRates } from "@/components/ui/ExchangeRatesProvider";
import { useI18n } from "@/components/ui/LanguageProvider";
import { nightsBetween, addDays } from "@/lib/format";

const POPOVER_GAP = 8;
const MOBILE_BREAKPOINT = 640;
const TABLET_MAX = 1023; // 640..1023 = tablet, 1024+ = desktop

function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function toISO(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function toYmdUtc(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function isDateInRanges(date: Date, ranges: Array<{ from: string; to: string }>): boolean {
  const d = toISO(date);
  return ranges.some((r) => d >= r.from && d < r.to);
}

/** day 셀에 날짜 + 1박 요금(선택 통화, 전체 금액) 표시. components.DayButton 으로 전달 */
function createDayButtonWithPrice(
  getPriceKrwForYmdUtc: (ymdUtc: string) => number | null,
  formatFromKRW: (amountKRW: number, currency: import("@/lib/currency").Currency) => string,
  currency: import("@/lib/currency").Currency
) {
  return function DayButtonWithPrice(
    props: { day: { date?: Date } | Date; modifiers?: Record<string, boolean> } & React.ButtonHTMLAttributes<HTMLButtonElement>
  ) {
    const { day, modifiers, className, ...rest } = props;
    const date =
      day != null && typeof day === "object" && "date" in day && day.date instanceof Date
        ? day.date
        : day instanceof Date
          ? day
          : undefined;
    const dayNum = date ? date.getDate() : "";
    const ymdUtc = date ? toYmdUtc(date) : "";
    const priceKrw = ymdUtc ? getPriceKrwForYmdUtc(ymdUtc) : null;
    const priceStr = priceKrw != null ? formatFromKRW(priceKrw, currency) : "";
    const isDisabled = modifiers?.disabled ?? modifiers?.outside;
    const isBooked = modifiers?.booked;
    const isBlocked = modifiers?.blocked;

    return (
      <button
        type="button"
        className={className}
        {...rest}
        style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 0 }}
      >
        <span className="rdp-day_button_day">{dayNum}</span>
        {priceStr ? (
          <span
            className="mt-0.5 text-[10px] font-normal tabular-nums leading-tight text-neutral-500 rdp-day_button_price"
            aria-hidden
            style={
              isDisabled || isBooked || isBlocked
                ? { color: "var(--rdp-day-button-muted, rgb(163 163 163))", opacity: 0.8 }
                : undefined
            }
          >
            {priceStr}
          </span>
        ) : (
          <span className="mt-0.5 text-[10px] leading-tight rdp-day_button_price" aria-hidden />
        )}
      </button>
    );
  };
}

export default function DateDropdown({
  range,
  onChange,
  onClose,
  numberOfMonths: numberOfMonthsProp,
  disabledRanges = [],
  bookedRanges = [],
  blockedRanges = [],
  overlay = false,
  anchorRef,
  bookingCardRef,
  listingId,
  basePricePerNightKRW,
}: {
  range: DateRange | undefined;
  onChange: (r: DateRange | undefined) => void;
  onClose: () => void;
  /** 좁은 영역(예: 상세 예약 위젯)에서는 1로 지정해 한 달만 표시. overlay일 때 데스크톱 2달, 모바일 1달 */
  numberOfMonths?: number;
  /** 예약된 날짜 범위 (해당 날짜 선택 불가) */
  disabledRanges?: Array<{ from: string; to: string }>;
  /** 예약된 구간 — "예약됨" 스타일 */
  bookedRanges?: Array<{ from: string; to: string }>;
  /** 판매 중지 구간 — "판매중지" 스타일 */
  blockedRanges?: Array<{ from: string; to: string }>;
  /** true면 Portal로 띄움. anchorRef 있으면 입력창 아래 팝오버(배경 스크롤 가능), 없으면 중앙 모달 */
  overlay?: boolean;
  /** overlay일 때 기준이 되는 요소. top은 이 요소 아래, right는 bookingCardRef 기준 */
  anchorRef?: RefObject<HTMLElement | null>;
  /** overlay일 때 오른쪽 정렬 기준. 있으면 캘린더 우측이 이 요소 우측과 일치 */
  bookingCardRef?: RefObject<HTMLElement | null>;
  /** 게스트용 날짜별 가격 API 호출을 위한 listing id */
  listingId?: string;
  /** 1박당 기본 요금(KRW). 있으면 캘린더에 날짜별 금액 표시(선택 통화로 변환) */
  basePricePerNightKRW?: number;
}) {
  const { t, locale } = useI18n();
  const { currency } = useCurrency();
  const { formatFromKRW } = useExchangeRates();
  const dayPickerLocale = useMemo(() => {
    if (locale.startsWith("ko")) return ko;
    if (locale.startsWith("ja")) return ja;
    if (locale.startsWith("zh")) return zhCN;
    return enUS;
  }, [locale]);
  const [datePrices, setDatePrices] = useState<Record<string, number>>({});
  const [visibleMonth, setVisibleMonth] = useState<Date>(() => startOfDay(new Date()));
  const [monthsResponsive, setMonthsResponsive] = useState(1);
  const [mounted, setMounted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const [popoverRect, setPopoverRect] = useState<{ top: number; right: number } | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    queueMicrotask(() => setMounted(true));
  }, []);
  const today = useMemo(() => startOfDay(new Date()), []);
  const monthsDesktop = overlay ? 2 : (numberOfMonthsProp ?? monthsResponsive);
  const months = overlay && (isMobile || isTablet) ? 1 : monthsDesktop;

  const modifiers = useMemo(() => {
    const m: Record<string, (date: Date) => boolean> = {};
    if (bookedRanges.length > 0) m.booked = (date: Date) => isDateInRanges(date, bookedRanges);
    if (blockedRanges.length > 0) m.blocked = (date: Date) => isDateInRanges(date, blockedRanges);
    return m;
  }, [bookedRanges, blockedRanges]);

  const modifiersClassNames = useMemo(() => {
    const c: Record<string, string> = {};
    if (bookedRanges.length > 0) c.booked = "rdp-booked";
    if (blockedRanges.length > 0) c.blocked = "rdp-blocked";
    return c;
  }, [bookedRanges.length, blockedRanges.length]);

  const getPriceKrwForYmdUtc = useCallback(
    (ymdUtc: string) => {
      if (basePricePerNightKRW == null || basePricePerNightKRW <= 0) return null;
      const v = datePrices[ymdUtc];
      return typeof v === "number" && Number.isFinite(v) && v >= 0 ? v : basePricePerNightKRW;
    },
    [basePricePerNightKRW, datePrices]
  );

  const dayButtonComponent = useMemo(() => {
    if (basePricePerNightKRW == null || basePricePerNightKRW <= 0) return undefined;
    return createDayButtonWithPrice(getPriceKrwForYmdUtc, formatFromKRW, currency);
  }, [basePricePerNightKRW, getPriceKrwForYmdUtc, formatFromKRW, currency]);

  const startOfMonth = useCallback((d: Date) => new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1)), []);
  const endOfMonth = useCallback(
    (d: Date) => new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0)),
    []
  );

  // Fetch public per-date prices for visible months (when used in listing booking widget).
  useEffect(() => {
    const shouldFetch = Boolean(listingId) && (basePricePerNightKRW ?? 0) > 0;
    if (!shouldFetch) return;
    let cancelled = false;

    const fetchPrices = async () => {
      try {
        const start = startOfMonth(visibleMonth);
        const lastVisibleMonth = new Date(Date.UTC(visibleMonth.getUTCFullYear(), visibleMonth.getUTCMonth() + (months - 1), 1));
        const end = endOfMonth(lastVisibleMonth);
        const from = toYmdUtc(start);
        const to = toYmdUtc(end);
        const res = await fetch(
          `/api/listings/${encodeURIComponent(listingId as string)}/date-prices?from=${from}&to=${to}`,
          { cache: "no-store" }
        );
        const json = await res.json().catch(() => ({}));
        const pricesArr: Array<{ date: string; priceKrw: number }> = json?.data?.prices ?? [];
        if (cancelled || !Array.isArray(pricesArr)) return;
        setDatePrices((prev) => {
          const next = { ...prev };
          for (const p of pricesArr) {
            if (p?.date && typeof p.priceKrw === "number" && Number.isFinite(p.priceKrw) && p.priceKrw >= 0) {
              next[String(p.date).slice(0, 10)] = p.priceKrw;
            }
          }
          return next;
        });
      } catch {
        // ignore (fallback to base price)
      }
    };

    fetchPrices();
    return () => {
      cancelled = true;
    };
  }, [listingId, basePricePerNightKRW, visibleMonth, months, startOfMonth, endOfMonth]);

  useEffect(() => {
    if (overlay || numberOfMonthsProp != null) return;
    const mq = window.matchMedia("(min-width: 640px)");
    const apply = () => setMonthsResponsive(mq.matches ? 2 : 1);
    apply();
    mq.addEventListener?.("change", apply);
    return () => mq.removeEventListener?.("change", apply);
  }, [overlay, numberOfMonthsProp]);

  const isPopoverMode = overlay && anchorRef;
  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
    const apply = () => setIsMobile(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);
  useEffect(() => {
    const mq = window.matchMedia(`(min-width: ${MOBILE_BREAKPOINT}px) and (max-width: ${TABLET_MAX}px)`);
    const apply = () => setIsTablet(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  const updatePopoverPosition = useCallback(() => {
    if (!anchorRef?.current) return;
    const anchorRect = anchorRef.current.getBoundingClientRect();
    const rightEl = bookingCardRef?.current ?? anchorRef.current;
    const rightRect = rightEl.getBoundingClientRect();
    setPopoverRect({
      top: anchorRect.bottom + POPOVER_GAP,
      right: window.innerWidth - rightRect.right,
    });
  }, [anchorRef, bookingCardRef]);

  useLayoutEffect(() => {
    if (!isPopoverMode || !mounted) return;
    updatePopoverPosition();
  }, [isPopoverMode, mounted, updatePopoverPosition]);

  useEffect(() => {
    if (!overlay || !mounted) return;
    const id = setTimeout(() => {
      panelRef.current?.setAttribute("tabIndex", "-1");
      panelRef.current?.focus({ preventScroll: true });
    }, 0);
    return () => clearTimeout(id);
  }, [overlay, mounted]);

  useEffect(() => {
    if (!isPopoverMode || !mounted) return;
    window.addEventListener("scroll", updatePopoverPosition, true);
    window.addEventListener("resize", updatePopoverPosition);
    return () => {
      window.removeEventListener("scroll", updatePopoverPosition, true);
      window.removeEventListener("resize", updatePopoverPosition);
    };
  }, [isPopoverMode, mounted, updatePopoverPosition]);

  useEffect(() => {
    if (!overlay) return;
    if (isPopoverMode) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [overlay, isPopoverMode]);

  useEffect(() => {
    if (!overlay) return;
    const onEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onEscape);
    return () => document.removeEventListener("keydown", onEscape);
  }, [overlay, onClose]);

  const fullDateFormatter = useMemo(
    () => new Intl.DateTimeFormat(locale, { month: "short", day: "numeric", year: "numeric" }),
    [locale]
  );
  const weekdayFormatter = useMemo(() => new Intl.DateTimeFormat(locale, { weekday: "short" }), [locale]);
  const rangeLabelFormatter = useMemo(
    () => new Intl.DateTimeFormat(locale, { year: "numeric", month: "long", day: "numeric" }),
    [locale]
  );
  const inputDateFormatter = useCallback((d: Date) => {
    const y = d.getFullYear();
    const m = d.getMonth() + 1;
    const day = d.getDate();
    return `${y}. ${m}. ${day}.`;
  }, []);

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
    return t("select_your_dates");
  }, [range, formatFull, t]);

  const nights = range?.from && range?.to ? Math.max(1, nightsBetween(range.from, range.to)) : 0;
  const showBookingHeader = overlay && anchorRef && !isMobile;
  const isTabletOverlay = overlay && anchorRef && isTablet;

  const panelContent = (
    <>
      {showBookingHeader ? (
        <div className={`flex flex-wrap items-start justify-between gap-2 ${isTabletOverlay ? "pt-1.5 pb-1" : "pt-3 pb-1.5"}`}>
          <div className={`flex flex-col gap-0.5 ${isTabletOverlay ? "min-w-0" : "min-w-[140px]"}`}>
            <div className="min-h-[1.5rem] text-base font-bold text-neutral-900">
              {nights > 0 ? `${nights}${nights === 1 ? t("night") : t("nights")}` : t("select_your_dates")}
            </div>
            <div className="min-h-[1.125rem] text-xs text-neutral-500">
              {range?.from && range?.to ? (
                <span className="text-neutral-500">
                  {rangeLabelFormatter.format(range.from)} - {rangeLabelFormatter.format(range.to)}
                </span>
              ) : (
                <span className="text-neutral-400">—</span>
              )}
            </div>
            {basePricePerNightKRW != null && basePricePerNightKRW > 0 && (
              <div className="min-h-[1.125rem] text-xs font-medium text-neutral-700 tabular-nums">
                {t("per_night")} {formatFromKRW(basePricePerNightKRW, currency)}
              </div>
            )}
          </div>
          <div className="flex flex-1 min-w-0 gap-2 sm:gap-3 flex-row">
            <div className={`flex flex-1 items-center gap-2 rounded-xl border border-neutral-300 bg-white px-3 py-2.5 transition-[border-color,box-shadow] focus-within:border-neutral-900 focus-within:ring-2 focus-within:ring-neutral-900 focus-within:ring-offset-0 ${isTabletOverlay ? "min-w-0" : "min-w-[200px]"}`}>
              <span className="shrink-0 text-xs font-medium text-neutral-500">{t("check_in")}</span>
              <span className="min-w-0 flex-1 text-sm text-neutral-900">
                {range?.from ? inputDateFormatter(range.from) : "—"}
              </span>
              <span className="flex h-9 w-9 shrink-0 items-center justify-center">
                {(range?.from ?? range?.to) && (
                  <button
                    type="button"
                    onClick={() => onChange(undefined)}
                    className="rounded-full p-1 hover:bg-neutral-100 transition"
                    aria-label={t("clear_dates")}
                  >
                    <X className="h-4 w-4 text-neutral-500" />
                  </button>
                )}
              </span>
            </div>
            <div className={`flex flex-1 items-center gap-2 rounded-xl border border-neutral-300 bg-white px-3 py-2.5 transition-[border-color,box-shadow] focus-within:border-neutral-900 focus-within:ring-2 focus-within:ring-neutral-900 focus-within:ring-offset-0 ${isTabletOverlay ? "min-w-0" : "min-w-[200px]"}`}>
              <span className="shrink-0 text-xs font-medium text-neutral-500">{t("check_out")}</span>
              <span className="min-w-0 flex-1 text-sm text-neutral-900">
                {range?.to ? inputDateFormatter(range.to) : "—"}
              </span>
              <span className="flex h-9 w-9 shrink-0 items-center justify-center">
                {(range?.from ?? range?.to) && (
                  <button
                    type="button"
                    onClick={() => onChange(undefined)}
                    className="rounded-full p-1 hover:bg-neutral-100 transition"
                    aria-label={t("clear_dates")}
                  >
                    <X className="h-4 w-4 text-neutral-500" />
                  </button>
                )}
              </span>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-between px-3 py-2 border-b border-neutral-100">
          <div className="text-sm font-semibold">{t("when_traveling")}</div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full hover:bg-neutral-100 transition"
            aria-label={t("close")}
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      )}

      <div className={`min-w-0 ${showBookingHeader ? (isTabletOverlay ? "mt-1 px-0.5" : "mt-2 px-0.5") : "px-1 py-2 sm:p-2"}`}>
        {!showBookingHeader && (
          <div className="mb-2 text-sm text-neutral-700">
            <span className="font-semibold">{t("selected")}:</span> {summary}
          </div>
        )}

        {basePricePerNightKRW != null && basePricePerNightKRW > 0 && (
          <div className={`flex items-center gap-1.5 text-xs text-neutral-500 ${isTabletOverlay ? "mb-1" : "mb-2"}`} role="status" aria-live="polite">
            <span className="text-neutral-400" aria-hidden>ⓘ</span>
            <span>{t("calendar_price_hint")}</span>
          </div>
        )}

        <div
          className={`rdp-calendar-wrap w-max max-w-full mx-auto overflow-x-auto rounded-xl min-w-0 ${basePricePerNightKRW != null && basePricePerNightKRW > 0 ? "rdp-with-price" : ""}`}
        >
          <DayPicker
            mode="range"
            selected={range}
            onSelect={onChange}
            numberOfMonths={months}
            showOutsideDays={false}
            startMonth={today}
            month={visibleMonth}
            onMonthChange={setVisibleMonth}
            locale={dayPickerLocale}
            disabled={(date) =>
              date < today || (disabledRanges.length > 0 && isDateInRanges(date, disabledRanges))
            }
            modifiers={Object.keys(modifiers).length > 0 ? modifiers : undefined}
            modifiersClassNames={Object.keys(modifiersClassNames).length > 0 ? modifiersClassNames : undefined}
            className="rdp-compact"
            components={dayButtonComponent ? { DayButton: dayButtonComponent } : undefined}
          />
        </div>
        {(bookedRanges.length > 0 || blockedRanges.length > 0 || (basePricePerNightKRW != null && basePricePerNightKRW > 0)) && (
          <div className={`min-w-0 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-neutral-500 ${isTabletOverlay ? "mt-1" : "mt-1.5"}`}>
            {basePricePerNightKRW != null && basePricePerNightKRW > 0 && (
              <span className="tabular-nums font-medium text-neutral-700">
                {t("per_night")} {formatFromKRW(basePricePerNightKRW, currency)}
              </span>
            )}
            {bookedRanges.length > 0 && (
              <span className="inline-flex items-center gap-1.5">
                <span className="h-3 w-3 rounded-sm bg-amber-100 border border-amber-200" aria-hidden />
                {t("calendar_booked")}
              </span>
            )}
            {blockedRanges.length > 0 && (
              <span className="inline-flex items-center gap-1.5">
                <span className="h-3 w-3 rounded-sm bg-neutral-200 opacity-60" aria-hidden />
                {t("calendar_blocked")}
              </span>
            )}
          </div>
        )}

        <div className={`flex flex-wrap items-center ${showBookingHeader ? "justify-between" : "justify-end"} gap-2 ${isTabletOverlay ? "mt-1.5" : "mt-2"}`}>
          {showBookingHeader ? (
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-neutral-400" aria-hidden>
              <Calendar className="h-5 w-5" />
            </span>
          ) : null}
          <div className="flex flex-wrap items-center gap-2 ml-auto">
            <button
              type="button"
              onClick={() => onChange(undefined)}
              className="rounded-xl border border-transparent px-4 py-2 text-sm font-semibold text-neutral-700 hover:bg-neutral-100 transition"
            >
              {showBookingHeader ? t("clear_dates") : t("clear")}
            </button>
            {!showBookingHeader && (
              <button
                type="button"
                onClick={() => onChange({ from: today, to: addDays(today, 1) })}
                className="rounded-xl border border-neutral-200 px-4 py-2 text-sm font-semibold hover:bg-neutral-50 transition"
              >
                {t("today_tomorrow")}
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl bg-neutral-900 px-4 py-2 text-sm font-semibold text-white hover:opacity-95 transition"
            >
              {showBookingHeader ? t("close") : t("done")}
            </button>
          </div>
        </div>
      </div>
    </>
  );

  useEffect(() => {
    if (!isPopoverMode || isMobile) return;
    const onMouseDown = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener("mousedown", onMouseDown);
    return () => document.removeEventListener("mousedown", onMouseDown);
  }, [isPopoverMode, isMobile, onClose]);

  if (overlay && mounted && typeof document !== "undefined") {
    const panel = (
      <div
        ref={panelRef}
        role="dialog"
        aria-modal={!isPopoverMode}
        aria-label={t("when_traveling")}
        className={
          isPopoverMode
            ? isMobile
              ? "rdp-panel-mobile fixed inset-x-0 bottom-0 z-[100] max-h-[85vh] overflow-y-auto overflow-x-hidden rounded-t-2xl border border-neutral-200 border-b-0 bg-white shadow-xl pt-3 pb-[env(safe-area-inset-bottom)]"
              : isTablet
              ? "rdp-panel-compact relative z-10 w-[94vw] max-w-[96vw] min-w-[92vw] rounded-2xl border border-neutral-200 bg-white py-2 px-3 shadow-[0_0_0_1px_rgba(0,0,0,0.04),0_8px_28px_rgba(0,0,0,0.12)] pb-[env(safe-area-inset-bottom,0)]"
              : "rdp-panel-compact fixed z-[100] min-w-[680px] w-fit max-w-[90vw] rounded-2xl bg-white font-sans py-2 px-2 shadow-[0_0_0_1px_rgba(0,0,0,0.04),0_8px_28px_rgba(0,0,0,0.12)]"
            : "relative z-10 w-fit max-w-[90vw] rounded-[32px] border border-neutral-200 bg-white py-3 px-3 shadow-[0_0_0_1px_rgba(0,0,0,0.04),0_8px_28px_rgba(0,0,0,0.12)]"
        }
        style={
          isPopoverMode && !isMobile && !isTablet && popoverRect
            ? { top: popoverRect.top, right: popoverRect.right, position: "fixed" as const }
            : undefined
        }
        onClick={isPopoverMode ? (e) => e.stopPropagation() : undefined}
      >
        {panelContent}
      </div>
    );

    if (isPopoverMode) {
      if (isMobile) {
        return createPortal(
          <>
            <div className="fixed inset-0 z-[99] bg-black/20" onClick={onClose} aria-hidden />
            {panel}
          </>,
          document.body
        );
      }
      if (isTablet) {
        return createPortal(
          <>
            <div className="fixed inset-0 z-[99] bg-black/20" onClick={onClose} aria-hidden />
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
              {panel}
            </div>
          </>,
          document.body
        );
      }
      if (popoverRect) {
        return createPortal(panel, document.body);
      }
      return null;
    }

    return createPortal(
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <div className="fixed inset-0 bg-black/40" onClick={onClose} aria-hidden />
        {panel}
      </div>,
      document.body
    );
  }

  return (
    <div className="w-max max-w-full rounded-2xl border border-neutral-200 bg-white shadow-md">
      {panelContent}
    </div>
  );
}
