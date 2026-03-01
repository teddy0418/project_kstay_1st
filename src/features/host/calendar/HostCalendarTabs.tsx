"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ChevronLeft,
  ChevronRight,
  User,
  Calendar as CalendarIcon,
  List,
  DollarSign,
} from "lucide-react";
import BookingDetailModal from "@/components/host/BookingDetailModal";
import type { HostCalendarListing, HostCalendarBooking } from "@/lib/repositories/host-calendar";

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];
const MONTHS = "1월,2월,3월,4월,5월,6월,7월,8월,9월,10월,11월,12월".split(",");

type TabId = "calendar" | "bookings" | "pricing";

type Props = {
  listings: HostCalendarListing[];
  initialListingId: string | null;
  /** 서버에서 getBlockedDates로 채운 이번 달 차단일 (대시보드와 동일 소스) */
  initialBlockedDates?: string[];
  year: number;
  month: number;
};

function formatKrw(n: number) {
  if (n >= 10000) return `₩${Math.round(n / 10000)}만`;
  return `₩${n.toLocaleString()}`;
}

function buildMonthGrid(year: number, month: number): (number | null)[][] {
  const first = new Date(year, month - 1, 1);
  const startSunday = new Date(first);
  startSunday.setDate(first.getDate() - first.getDay());
  const grid: (number | null)[][] = [];
  const current = new Date(startSunday);
  for (let row = 0; row < 6; row++) {
    const week: (number | null)[] = [];
    for (let col = 0; col < 7; col++) {
      const y = current.getFullYear();
      const m = current.getMonth() + 1;
      const d = current.getDate();
      week.push(y === year && m === month ? d : null);
      current.setDate(current.getDate() + 1);
    }
    grid.push(week);
  }
  return grid;
}

export default function HostCalendarTabs({
  listings,
  initialListingId,
  initialBlockedDates = [],
  year: initialYear,
  month: initialMonth,
}: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [tab, setTab] = useState<TabId>("calendar");
  const [listingId, setListingIdState] = useState<string | null>(initialListingId);
  useEffect(() => {
    setListingIdState(initialListingId);
  }, [initialListingId]);
  const setListingId = (id: string | null) => {
    setListingIdState(id);
    const params = new URLSearchParams(searchParams.toString());
    if (id) params.set("listingId", id);
    else params.delete("listingId");
    router.replace(`/host/calendar?${params.toString()}`, { scroll: false });
  };
  const [year, setYear] = useState(initialYear);
  const [month, setMonth] = useState(initialMonth);
  const [bookings, setBookings] = useState<HostCalendarBooking[]>([]);
  const [blockedDates, setBlockedDates] = useState<string[]>(initialBlockedDates);
  const [datePrices, setDatePrices] = useState<Record<string, number>>({});
  const [modal, setModal] = useState<{ bookingId: string | null; date: string } | null>(null);
  const [bookingFilter, setBookingFilter] = useState<string>("");
  const [allBookings, setAllBookings] = useState<HostCalendarBooking[]>([]);
  const [syncVersion, setSyncVersion] = useState(0);

  useEffect(() => {
    if (listingId === initialListingId && year === initialYear && month === initialMonth) {
      setBlockedDates(initialBlockedDates);
    }
  }, [initialListingId, initialYear, initialMonth, initialBlockedDates, listingId, year, month]);

  const selectedListing = listings.find((l) => l.id === listingId) ?? null;
  const basePriceKrw = selectedListing?.basePriceKrw ?? 0;
  const [icalUrlInput, setIcalUrlInput] = useState<string>(selectedListing?.icalUrl ?? "");

  const monthStart = useMemo(() => new Date(year, month - 1, 1), [year, month]);
  const monthEnd = useMemo(() => new Date(year, month, 0), [year, month]);
  const fromStr = useMemo(
    () => `${year}-${String(month).padStart(2, "0")}-01`,
    [year, month]
  );
  const toStr = useMemo(
    () =>
      `${year}-${String(month).padStart(2, "0")}-${String(monthEnd.getDate()).padStart(2, "0")}`,
    [year, month, monthEnd]
  );

  // 대시보드에서 판매 닫기 후 캘린더 탭으로 돌아오면 차단일 다시 불러오기
  useEffect(() => {
    const onVisible = () => setSyncVersion((v) => v + 1);
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, []);

  // Fetch blocked dates & date prices for calendar month
  useEffect(() => {
    setIcalUrlInput(selectedListing?.icalUrl ?? "");
  }, [selectedListing?.id, selectedListing?.icalUrl]);

  const refetchBlockedAndPrices = useCallback(() => {
    if (!listingId) return;
    const t = Date.now();
    Promise.all([
      fetch(
        `/api/host/listings/${listingId}/blocked-dates?from=${fromStr}&to=${toStr}&_=${t}`,
        { cache: "no-store" }
      )
        .then((r) => r.json())
        .then((d) => setBlockedDates(Array.isArray(d?.data?.dates) ? d.data.dates : [])),
      fetch(
        `/api/host/listings/${listingId}/date-prices?from=${fromStr}&to=${toStr}&_=${t}`
      ).then((r) =>
        r.json().then((d) => {
          const map: Record<string, number> = {};
          (d.data?.prices ?? []).forEach((p: { date: string; priceKrw: number }) => {
            map[p.date] = p.priceKrw;
          });
          setDatePrices(map);
        })
      ),
    ]).catch(() => {});
  }, [listingId, fromStr, toStr]);

  useEffect(() => {
    refetchBlockedAndPrices();
  }, [refetchBlockedAndPrices, syncVersion]);

  useEffect(() => {
    if (!listingId) {
      queueMicrotask(() => setBookings([]));
      return;
    }
    fetch(
      `/api/host/calendar/data?listingId=${listingId}&year=${year}&month=${month}`
    ).then((r) => r.json()).then((res) => {
      setBookings(res.data?.bookings ?? []);
    }).catch(() => setBookings([]));
  }, [listingId, year, month, syncVersion]);

  useEffect(() => {
    const params = new URLSearchParams();
    if (listingId) params.set("listingId", listingId);
    if (bookingFilter) params.set("status", bookingFilter);
    fetch(`/api/host/bookings?${params}`)
      .then((r) => r.json())
      .then((res) => setAllBookings(res.data?.bookings ?? []))
      .catch(() => setAllBookings([]));
  }, [listingId, bookingFilter, tab, syncVersion]);

  const grid = useMemo(() => buildMonthGrid(year, month), [year, month]);

  const isDayBooked = (y: number, m: number, d: number) =>
    bookings.some((b) => {
      const checkIn = new Date(b.checkIn);
      const checkOut = new Date(b.checkOut);
      const day = new Date(y, m - 1, d);
      return day >= checkIn && day <= checkOut;
    });

  const toggleBlock = async (dateStr: string) => {
    if (!listingId) return;
    const isBlocked = blockedDates.includes(dateStr);
    const url = `/api/host/listings/${listingId}/blocked-dates`;
    if (isBlocked) {
      await fetch(`${url}?date=${dateStr}`, { method: "DELETE" });
      setBlockedDates((prev) => prev.filter((d) => d !== dateStr));
    } else {
      await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date: dateStr }),
      });
      setBlockedDates((prev) => [...prev, dateStr]);
    }
  };

  const tabs: { id: TabId; label: string; icon: React.ReactNode }[] = [
    { id: "calendar", label: "통합 달력", icon: <CalendarIcon className="h-4 w-4" /> },
    { id: "bookings", label: "예약 목록", icon: <List className="h-4 w-4" /> },
    { id: "pricing", label: "유동 가격 설정", icon: <DollarSign className="h-4 w-4" /> },
  ];

  const handleSaveIcal = async () => {
    if (!listingId) return;
    const body: { icalUrl: string | null } = { icalUrl: icalUrlInput ? icalUrlInput : null };
    await fetch(`/api/host/listings/${listingId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  };

  const handleSyncIcal = async () => {
    if (!listingId) return;
    await handleSaveIcal();
    await fetch(`/api/host/listings/${listingId}/ical-sync`, {
      method: "POST",
    });
    setSyncVersion((v) => v + 1);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex rounded-xl border border-neutral-200 bg-white p-1 overflow-x-auto min-w-0">
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-semibold transition shrink-0 whitespace-nowrap ${
                tab === t.id ? "bg-neutral-900 text-white" : "text-neutral-600 hover:bg-neutral-100"
              }`}
            >
              {t.icon}
              {t.label}
            </button>
          ))}
        </div>

        {listings.length > 0 && (
          <select
            value={listingId ?? ""}
            onChange={(e) => setListingId(e.target.value || null)}
            className="rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-sm font-medium"
          >
            {listings.map((l) => (
              <option key={l.id} value={l.id}>{l.title}</option>
            ))}
          </select>
        )}
      </div>

      {selectedListing && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-neutral-200 bg-white p-4">
          <div className="space-y-1">
            <div className="text-sm font-semibold text-neutral-800">외부 캘린더(iCal) 연동</div>
            <p className="text-xs text-neutral-500">
              Airbnb, Booking.com 등에서 제공하는 iCal 주소를 입력하면 해당 일정이 이 캘린더에 막힘 날짜로 표시됩니다.
            </p>
            {selectedListing.icalLastSyncedAt && (
              <p className="text-xs text-neutral-500">
                마지막 동기화:{" "}
                {new Date(selectedListing.icalLastSyncedAt).toLocaleString("ko-KR")}
              </p>
            )}
          </div>
          <div className="flex w-full flex-1 flex-col gap-3 min-w-0 sm:flex-row sm:flex-wrap sm:items-center sm:justify-end">
            <input
              type="url"
              value={icalUrlInput ?? ""}
              onChange={(e) => setIcalUrlInput(e.target.value)}
              placeholder="https://example.com/calendar.ics"
              className="min-w-0 flex-1 rounded-xl border border-neutral-200 px-3 py-2.5 text-sm"
            />
            <div className="flex flex-wrap gap-2 sm:gap-3">
              <button
                type="button"
                onClick={() => void handleSaveIcal()}
                className="rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-xs font-semibold text-neutral-800 hover:bg-neutral-50"
              >
                URL 저장
              </button>
              <button
                type="button"
                onClick={() => void handleSyncIcal()}
                className="rounded-xl bg-neutral-900 px-4 py-2.5 text-xs font-semibold text-white hover:bg-neutral-800"
              >
                지금 동기화
              </button>
            </div>
          </div>
        </div>
      )}

      {tab === "calendar" && (
        <div className="rounded-2xl border border-neutral-200 bg-white overflow-hidden min-w-0">
          <div className="overflow-x-auto overflow-y-hidden">
            <div className="min-w-[320px]">
          <div className="flex items-center justify-between border-b border-neutral-100 p-3 sm:p-4 flex-wrap gap-2">
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  if (month === 1) {
                    setYear((y) => y - 1);
                    setMonth(12);
                  } else setMonth((m) => m - 1);
                }}
                className="rounded-lg p-2 hover:bg-neutral-100"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <span className="flex items-center px-4 text-lg font-semibold">
                {year}년 {MONTHS[month - 1]}
              </span>
              <button
                type="button"
                onClick={() => {
                  if (month === 12) {
                    setYear((y) => y + 1);
                    setMonth(1);
                  } else setMonth((m) => m + 1);
                }}
                className="rounded-lg p-2 hover:bg-neutral-100"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
            <button
              type="button"
              onClick={() => setSyncVersion((v) => v + 1)}
              className="rounded-xl border border-neutral-200 bg-white px-3 py-2 text-xs font-semibold text-neutral-700 hover:bg-neutral-50"
              title="대시보드에서 판매 중지한 날짜를 반영합니다"
            >
              차단일 새로고침
            </button>
          </div>
          <div className="grid grid-cols-7 border-b border-neutral-100 bg-neutral-50">
            {WEEKDAYS.map((w) => (
              <div key={w} className="py-2 text-center text-xs font-semibold text-neutral-500">{w}</div>
            ))}
          </div>
          {grid.map((week, wi) => (
            <div key={wi} className="grid grid-cols-7 border-b border-neutral-100 last:border-b-0">
              {week.map((day, di) => {
                const isCurrentMonth = day !== null;
                const dateStr =
                  isCurrentMonth && day !== null
                    ? `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`
                    : "";
                const cellDate = isCurrentMonth && day !== null ? new Date(year, month - 1, day) : null;
                const today = new Date();
                const isPast =
                  cellDate != null &&
                  (cellDate.getFullYear() < today.getFullYear() ||
                    (cellDate.getFullYear() === today.getFullYear() &&
                      (cellDate.getMonth() < today.getMonth() ||
                        (cellDate.getMonth() === today.getMonth() && cellDate.getDate() < today.getDate()))));
                const booked = isCurrentMonth && day !== null && isDayBooked(year, month, day);
                const blocked = dateStr && blockedDates.includes(dateStr);
                const price = dateStr && (datePrices[dateStr] ?? basePriceKrw);
                return (
                  <div
                    key={di}
                    className={`min-h-[72px] sm:min-h-[88px] border-r border-neutral-100 p-1.5 sm:p-2 last:border-r-0 overflow-hidden ${
                      isPast ? "bg-neutral-50" : blocked ? "bg-red-50 border-l-2 border-l-red-300" : "bg-white"
                    } ${isPast ? "opacity-80" : ""}`}
                  >
                    {isCurrentMonth && (
                      <>
                        <div className="flex flex-col gap-0.5 min-h-[24px] min-w-0 sm:flex-row sm:items-center sm:justify-between">
                          <span className={`text-xs sm:text-sm font-semibold truncate ${isPast ? "text-neutral-400" : blocked ? "text-red-800" : "text-neutral-900"}`} title={isPast ? "지난 날짜" : undefined}>
                            {day}
                            {isPast && <span className="hidden sm:inline ml-0.5 text-[10px] sm:text-xs text-neutral-400">(지남)</span>}
                          </span>
                          {!booked && !isPast && (
                            <button
                              type="button"
                              onClick={() => toggleBlock(dateStr)}
                              className={`rounded px-1 py-0.5 w-fit min-w-[28px] text-[10px] font-semibold shrink-0 self-start sm:self-auto ${
                                blocked
                                  ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                                  : "bg-white text-red-600 hover:bg-red-50 border border-red-200"
                              }`}
                              title={blocked ? "판매 재개" : "판매 중지"}
                            >
                              {blocked ? "판매" : "중지"}
                            </button>
                          )}
                        </div>
                        {!booked && !blocked && Number(price) > 0 && (
                          <div className="mt-0.5 text-[10px] sm:text-xs text-neutral-600 truncate">{formatKrw(Number.isFinite(Number(price)) ? Number(price) : 0)}</div>
                        )}
                        {booked && (
                          <button
                            type="button"
                            onClick={() => {
                              const b = bookings.find((x) => {
                                const checkIn = new Date(x.checkIn);
                                const checkOut = new Date(x.checkOut);
                                const d = new Date(year, month - 1, day!);
                                return d >= checkIn && d <= checkOut;
                              });
                              setModal({ bookingId: b?.id ?? null, date: dateStr });
                            }}
                            className="mt-1 flex items-center gap-1 rounded bg-neutral-800 px-2 py-1 text-xs text-white"
                          >
                            <User className="h-3 w-3" />
                            예약
                          </button>
                        )}
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
            </div>
          </div>
        </div>
      )}

      {tab === "bookings" && (
        <div className="rounded-2xl border border-neutral-200 bg-white p-6">
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <span className="text-sm font-semibold text-neutral-700">상태 필터</span>
            <select
              value={bookingFilter}
              onChange={(e) => setBookingFilter(e.target.value)}
              className="rounded-lg border border-neutral-200 px-3 py-2 text-sm"
            >
              <option value="">전체</option>
              <option value="CONFIRMED">결제 완료</option>
              <option value="PENDING_PAYMENT">결제 대기</option>
              <option value="CANCELLED">취소</option>
            </select>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-neutral-200 text-left text-neutral-500">
                  <th className="pb-2 pr-4">숙소</th>
                  <th className="pb-2 pr-4">게스트</th>
                  <th className="pb-2 pr-4">체크인</th>
                  <th className="pb-2 pr-4">체크아웃</th>
                  <th className="pb-2 pr-4">상태</th>
                  <th className="pb-2">금액</th>
                </tr>
              </thead>
              <tbody>
                {allBookings.map((b) => (
                  <tr key={b.id} className="border-b border-neutral-100">
                    <td className="py-3 pr-4">{b.listingTitle}</td>
                    <td className="py-3 pr-4">{b.guestName ?? "게스트"}</td>
                    <td className="py-3 pr-4">{new Date(b.checkIn).toLocaleDateString("ko-KR")}</td>
                    <td className="py-3 pr-4">{new Date(b.checkOut).toLocaleDateString("ko-KR")}</td>
                    <td className="py-3 pr-4">
                      <span
                        className={
                          b.status === "CONFIRMED"
                            ? "text-emerald-600"
                            : b.status === "CANCELLED"
                            ? "text-red-600"
                            : "text-amber-600"
                        }
                      >
                        {b.status === "CONFIRMED" ? "결제완료" : b.status === "CANCELLED" ? "취소" : "결제대기"}
                      </span>
                    </td>
                    <td className="py-3">{formatKrw(b.totalKrw)}</td>
                    <td className="py-3 pl-2 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setModal({ bookingId: b.id, date: new Date(b.checkIn).toISOString().slice(0, 10) })}
                        className="text-neutral-600 underline hover:text-neutral-900"
                      >
                        상세
                      </button>
                      {b.status === "PENDING_PAYMENT" && (
                        <button
                          type="button"
                          onClick={async () => {
                            if (!confirm("이 예약을 거절하시겠습니까?")) return;
                            const res = await fetch(`/api/host/bookings/${b.id}/decline`, { method: "POST" });
                            if (res.ok) setAllBookings((prev) => prev.filter((x) => x.id !== b.id));
                          }}
                          className="text-red-600 text-xs font-medium hover:underline"
                        >
                          거절
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {allBookings.length === 0 && (
            <p className="py-8 text-center text-neutral-500">예약이 없습니다.</p>
          )}
        </div>
      )}

      {tab === "pricing" && (
        <div className="rounded-2xl border border-neutral-200 bg-white p-4 sm:p-6">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs sm:text-sm text-neutral-600 min-w-0">
              날짜별 요금 설정 · 기본: {formatKrw(basePriceKrw)}
            </p>
            <div className="flex items-center gap-1 rounded-xl border border-neutral-200 bg-white p-1 shrink-0">
              <button
                type="button"
                onClick={() => {
                  if (month === 1) {
                    setYear((y) => y - 1);
                    setMonth(12);
                  } else setMonth((m) => m - 1);
                }}
                className="rounded-lg p-2 text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900"
                aria-label="이전 달"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <span className="min-w-0 sm:min-w-[8rem] px-2 sm:px-3 py-2 text-center text-sm font-semibold text-neutral-900">
                {year}년 {MONTHS[month - 1]}
              </span>
              <button
                type="button"
                onClick={() => {
                  if (month === 12) {
                    setYear((y) => y + 1);
                    setMonth(1);
                  } else setMonth((m) => m + 1);
                }}
                className="rounded-lg p-2 text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900"
                aria-label="다음 달"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          </div>
          {/* 모바일: 3열 그리드로 콤팩트 · 데스크: 4~5열 */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 min-w-0">
            {Array.from(
              { length: new Date(year, month, 0).getDate() },
              (_, i) => i + 1
            ).map((day) => {
              const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
              const rawPrice = datePrices[dateStr] ?? basePriceKrw;
              const price = Number.isFinite(Number(rawPrice)) ? Number(rawPrice) : basePriceKrw;
              return (
                <div
                  key={dateStr}
                  className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 rounded-lg sm:rounded-xl border border-neutral-200 bg-neutral-50 px-2 py-1.5 sm:px-3 sm:py-2 min-w-0"
                >
                  <span className="text-xs sm:text-sm font-medium shrink-0 tabular-nums">{month}/{day}</span>
                  <div className="flex items-center gap-1 min-w-0">
                    <input
                      type="number"
                      value={price}
                      onChange={(e) => {
                        const v = parseInt(e.target.value, 10);
                        if (!Number.isNaN(v) && v >= 0) {
                          setDatePrices((prev) => ({ ...prev, [dateStr]: v }));
                        }
                      }}
                      onBlur={(e) => {
                        if (!listingId) return;
                        const v = parseInt((e.target as HTMLInputElement).value, 10);
                        const priceKrw = Number.isNaN(v) || v < 0 ? basePriceKrw : v;
                        fetch(`/api/host/listings/${listingId}/date-prices`, {
                          method: "PUT",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ date: dateStr, priceKrw }),
                        });
                      }}
                      className="w-full min-w-0 max-w-[6rem] sm:w-20 rounded border border-neutral-200 px-1.5 py-1 text-xs sm:text-sm tabular-nums"
                    />
                    <span className="text-[10px] sm:text-xs text-neutral-500 shrink-0">원</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {modal && listingId && modal.bookingId && (
        <BookingDetailModal
          open
          onClose={() => setModal(null)}
          bookingId={modal.bookingId}
          listingId={listingId}
        />
      )}
    </div>
  );
}
