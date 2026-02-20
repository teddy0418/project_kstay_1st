"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { totalGuestPriceKRW } from "@/lib/policy";
import { formatDualPriceFromKRW } from "@/lib/currency";
import { useCurrency } from "@/components/ui/CurrencyProvider";
import { useI18n } from "@/components/ui/LanguageProvider";

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
function toISO(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
function parseISO(s: string) {
  return new Date(`${s}T00:00:00`);
}
function nightsBetween(fromISO: string, toISODate: string) {
  const a = startOfDay(parseISO(fromISO)).getTime();
  const b = startOfDay(parseISO(toISODate)).getTime();
  const n = Math.round((b - a) / (1000 * 60 * 60 * 24));
  return Math.max(1, n);
}
function formatDateEN(d: Date) {
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(d);
}
function freeCancelUntilKST(checkInISO: string) {
  const checkIn = parseISO(checkInISO);
  const deadline = addDays(checkIn, -7);
  // KST 기준 23:59 표기용 (실제 TZ 변환은 MVP에서 생략)
  return `${formatDateEN(deadline)} 23:59 (KST)`;
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
  const { currency } = useCurrency();
  const { lang } = useI18n();
  const c =
    lang === "ko"
      ? {
          total: "총 결제금액",
          included: "세금/서비스 요금 포함 · (약 {approx})",
          perNight: "1박 기준",
          checkIn: "체크인",
          checkOut: "체크아웃",
          guests: "인원",
          guest: "명",
          freeCancel: "무료 취소 가능 기한",
          reserve: "예약하기",
          notCharged: "아직 결제되지 않습니다. (MVP)",
        }
      : lang === "ja"
        ? {
            total: "合計金額",
            included: "税・サービス料込み · (約 {approx})",
            perNight: "1泊あたり",
            checkIn: "チェックイン",
            checkOut: "チェックアウト",
            guests: "人数",
            guest: "名",
            freeCancel: "無料キャンセル期限",
            reserve: "予約する",
            notCharged: "まだ課金されません。(MVP)",
          }
        : lang === "zh"
          ? {
              total: "总金额",
              included: "含税及服务费 · (约 {approx})",
              perNight: "每晚",
              checkIn: "入住",
              checkOut: "退房",
              guests: "人数",
              guest: "位",
              freeCancel: "免费取消截止",
              reserve: "预订",
              notCharged: "目前不会扣款。(MVP)",
            }
          : {
              total: "Total",
              included: "Tax & service fee included · (≈ {approx})",
              perNight: "per night",
              checkIn: "CHECK-IN",
              checkOut: "CHECK-OUT",
              guests: "GUESTS",
              guest: "guest",
              freeCancel: "Free cancellation until",
              reserve: "Reserve",
              notCharged: "You won't be charged yet. (MVP)",
            };

  const today = useMemo(() => startOfDay(new Date()), []);
  const isoToday = toISO(today);
  const isoTomorrow = toISO(addDays(today, 1));

  const [checkIn, setCheckIn] = useState(defaultStart ?? isoToday);
  const [checkOut, setCheckOut] = useState(defaultEnd ?? isoTomorrow);
  const [guests, setGuests] = useState(Math.max(1, defaultGuests ?? 2));

  // keep valid
  const nights = useMemo(() => nightsBetween(checkIn, checkOut), [checkIn, checkOut]);

  const nightlyAllInKRW = totalGuestPriceKRW(basePricePerNightKRW);
  const totalKRW = nightlyAllInKRW * nights;

  const totalDual = formatDualPriceFromKRW(totalKRW, currency);
  const nightlyDual = formatDualPriceFromKRW(nightlyAllInKRW, currency);

  const cancelText = freeCancelUntilKST(checkIn);

  const onChangeCheckIn = (v: string) => {
    setCheckIn(v);
    // if invalid, push checkout +1
    if (parseISO(v).getTime() >= parseISO(checkOut).getTime()) {
      const next = toISO(addDays(parseISO(v), 1));
      setCheckOut(next);
    }
  };

  const onChangeCheckOut = (v: string) => {
    // if invalid, force +1
    if (parseISO(v).getTime() <= parseISO(checkIn).getTime()) {
      const next = toISO(addDays(parseISO(checkIn), 1));
      setCheckOut(next);
      return;
    }
    setCheckOut(v);
  };

  const reserve = () => {
    const params = new URLSearchParams();
    params.set("listingId", String(listingId));
    params.set("start", checkIn);
    params.set("end", checkOut);
    params.set("guests", String(guests));

    router.push(`/checkout?${params.toString()}`);
  };

  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-md">
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
        <div className="grid grid-cols-2">
          <div className="border-r border-neutral-200 p-3">
            <div className="text-[11px] font-semibold text-neutral-500">{c.checkIn}</div>
            <input
              type="date"
              value={checkIn}
              min={isoToday}
              onChange={(e) => onChangeCheckIn(e.target.value)}
              className="mt-1 w-full bg-transparent text-sm font-semibold text-neutral-900 outline-none"
            />
          </div>

          <div className="p-3">
            <div className="text-[11px] font-semibold text-neutral-500">{c.checkOut}</div>
            <input
              type="date"
              value={checkOut}
              min={toISO(addDays(parseISO(checkIn), 1))}
              onChange={(e) => onChangeCheckOut(e.target.value)}
              className="mt-1 w-full bg-transparent text-sm font-semibold text-neutral-900 outline-none"
            />
          </div>
        </div>

        <div className="border-t border-neutral-200 p-3">
          <div className="text-[11px] font-semibold text-neutral-500">{c.guests}</div>
          <select
            value={guests}
            onChange={(e) => setGuests(Number(e.target.value))}
            className="mt-1 w-full bg-transparent text-sm font-semibold text-neutral-900 outline-none"
          >
            {Array.from({ length: 16 }).map((_, i) => (
              <option key={i + 1} value={i + 1}>
                {i + 1} {c.guest}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="mt-3 rounded-xl bg-neutral-50 px-3 py-2 text-xs text-neutral-700">
        {c.freeCancel} <span className="font-semibold">{cancelText}</span>
      </div>

      <button
        type="button"
        onClick={reserve}
        className="mt-4 w-full rounded-full bg-neutral-900 py-3 text-sm font-semibold text-white hover:opacity-95 transition"
      >
        {c.reserve}
      </button>
      <div className="mt-2 text-center text-xs text-neutral-500">
        {c.notCharged}
      </div>
    </div>
  );
}
