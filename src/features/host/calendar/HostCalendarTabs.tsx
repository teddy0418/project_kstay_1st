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
  Trash2,
  Link2,
} from "lucide-react";
import BookingDetailModal from "@/components/host/BookingDetailModal";
import type { HostCalendarListing, HostCalendarBooking } from "@/lib/repositories/host-calendar";

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];
const MONTHS = "1월,2월,3월,4월,5월,6월,7월,8월,9월,10월,11월,12월".split(",");

type TabId = "calendar" | "bookings" | "pricing" | "ical";

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

/** 서버/클라이언트 동일 출력으로 hydration 오류 방지 (UTC 기준) */
function formatIsoDateOnly(iso: string | Date): string {
  const d = typeof iso === "string" ? new Date(iso) : iso;
  const y = d.getUTCFullYear();
  const m = d.getUTCMonth() + 1;
  const day = d.getUTCDate();
  const h = d.getUTCHours();
  const min = String(d.getUTCMinutes()).padStart(2, "0");
  return `${y}. ${m}. ${day}. ${h}:${min}`;
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
  const [cancelConfirmBookingId, setCancelConfirmBookingId] = useState<string | null>(null);
  const [bookingFilter, setBookingFilter] = useState<string>("");
  const [bookingPage, setBookingPage] = useState(1);
  const [allBookings, setAllBookings] = useState<HostCalendarBooking[]>([]);
  const [syncVersion, setSyncVersion] = useState(0);

  const BOOKINGS_PER_PAGE = 10;

  useEffect(() => {
    if (listingId === initialListingId && year === initialYear && month === initialMonth) {
      setBlockedDates(initialBlockedDates);
    }
  }, [initialListingId, initialYear, initialMonth, initialBlockedDates, listingId, year, month]);

  const selectedListing = listings.find((l) => l.id === listingId) ?? null;
  const basePriceKrw = selectedListing?.basePriceKrw ?? 0;

  type IcalFeedItem = { id: string; name: string; url: string; syncEnabled?: boolean; lastSyncedAt: string | null; lastSyncStatus: string | null };
  const [icalFeeds, setIcalFeeds] = useState<IcalFeedItem[]>([]);
  const [newFeedName, setNewFeedName] = useState("");
  const [newFeedUrl, setNewFeedUrl] = useState("");
  const [togglingFeedId, setTogglingFeedId] = useState<string | null>(null);

  /** 테스트용: ?icalPreview=1 이면 캘린더가 하나 연결된 것처럼 목록만 표시 (실제 등록/동기화 없음). 고정 날짜로 hydration 오류 방지. */
  const icalPreview = searchParams.get("icalPreview") === "1";
  const displayFeeds = useMemo(() => {
    if (icalFeeds.length > 0) return icalFeeds;
    if (icalPreview) {
      return [
        {
          id: "__preview__",
          name: "에어비앤비",
          url: "https://example.com/calendar.ics",
          syncEnabled: true,
          lastSyncedAt: "2026-03-01T12:00:00.000Z",
          lastSyncStatus: null as string | null,
        } satisfies IcalFeedItem,
      ];
    }
    return [];
  }, [icalFeeds, icalPreview]);

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

  const refetchIcalFeeds = useCallback(() => {
    if (!listingId) return;
    fetch(`/api/host/listings/${listingId}/ical-feeds`, { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : Promise.resolve({ data: [] })))
      .then((res) => setIcalFeeds(Array.isArray(res?.data) ? res.data : []))
      .catch(() => setIcalFeeds([]));
  }, [listingId]);

  useEffect(() => {
    refetchIcalFeeds();
  }, [refetchIcalFeeds]);

  const refetchBlockedAndPrices = useCallback(() => {
    if (!listingId) return;
    const t = Date.now();
    Promise.all([
      fetch(
        `/api/host/listings/${listingId}/blocked-dates?from=${fromStr}&to=${toStr}&_=${t}`,
        { cache: "no-store" }
      )
        .then((r) => (r.ok ? r.json() : Promise.resolve({ data: { dates: [] } })))
        .then((d) => setBlockedDates(Array.isArray(d?.data?.dates) ? d.data.dates : []))
        .catch(() => setBlockedDates([])),
      fetch(
        `/api/host/listings/${listingId}/date-prices?from=${fromStr}&to=${toStr}&_=${t}`,
        { cache: "no-store" }
      )
        .then((r) => (r.ok ? r.json() : Promise.resolve({ data: { prices: [] } })))
        .then((d) => {
          const map: Record<string, number> = {};
          (d?.data?.prices ?? []).forEach((p: { date: string; priceKrw: number }) => {
            map[p.date] = p.priceKrw;
          });
          setDatePrices(map);
        })
        .catch(() => setDatePrices({})),
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
    const ac = new AbortController();
    fetch(
      `/api/host/calendar/data?listingId=${listingId}&year=${year}&month=${month}`,
      { signal: ac.signal, cache: "no-store" }
    )
      .then((r) => (r.ok ? r.json() : Promise.resolve({ data: { bookings: [] } })))
      .then((res) => setBookings(res?.data?.bookings ?? []))
      .catch((err) => { if (err?.name !== "AbortError") setBookings([]); });
    return () => ac.abort();
  }, [listingId, year, month, syncVersion]);

  useEffect(() => {
    const params = new URLSearchParams();
    if (listingId) params.set("listingId", listingId);
    if (bookingFilter) params.set("status", bookingFilter);
    const ac = new AbortController();
    fetch(`/api/host/bookings?${params}`, { signal: ac.signal, cache: "no-store" })
      .then((r) => (r.ok ? r.json() : Promise.resolve({ data: { bookings: [] } })))
      .then((res) => setAllBookings(res?.data?.bookings ?? []))
      .catch((err) => { if (err?.name !== "AbortError") setAllBookings([]); });
    return () => ac.abort();
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

  const tabs: { id: TabId; label: string; shortLabel: string; icon: React.ReactNode }[] = [
    { id: "calendar", label: "통합 달력", shortLabel: "달력", icon: <CalendarIcon className="h-6 w-6 shrink-0 sm:h-4 sm:w-4" /> },
    { id: "bookings", label: "예약 목록", shortLabel: "예약", icon: <List className="h-6 w-6 shrink-0 sm:h-4 sm:w-4" /> },
    { id: "pricing", label: "유동 가격 설정", shortLabel: "가격", icon: <DollarSign className="h-6 w-6 shrink-0 sm:h-4 sm:w-4" /> },
    { id: "ical", label: "캘린더 연동", shortLabel: "연동", icon: <Link2 className="h-6 w-6 shrink-0 sm:h-4 sm:w-4" /> },
  ];

  const getBookingStatusLabel = (b: { status: string; cancelledBy?: string | null }) => {
    if (b.status === "CONFIRMED") return "예약 확정";
    if (b.status === "CANCELLED") {
      if (b.cancelledBy === "GUEST") return "게스트 측 취소";
      if (b.cancelledBy === "HOST") return "호스트 측 취소";
      return "취소";
    }
    return "결제대기";
  };

  const handleAddFeed = async () => {
    if (!listingId || !newFeedUrl.trim()) return;
    const res = await fetch(`/api/host/listings/${listingId}/ical-feeds`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newFeedName.trim() || "외부 캘린더", url: newFeedUrl.trim() }),
    });
    if (res.ok) {
      setNewFeedName("");
      setNewFeedUrl("");
      refetchIcalFeeds();
    }
  };

  const handleDeleteFeed = async (feedId: string) => {
    if (!listingId) return;
    await fetch(`/api/host/listings/${listingId}/ical-feeds/${feedId}`, { method: "DELETE" });
    refetchIcalFeeds();
  };

  const handleToggleSync = async (feedId: string, current: boolean) => {
    if (!listingId) return;
    setTogglingFeedId(feedId);
    try {
      await fetch(`/api/host/listings/${listingId}/ical-feeds/${feedId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ syncEnabled: !current }),
      });
      await refetchIcalFeeds();
      await fetch(`/api/host/listings/${listingId}/ical-sync`, { method: "POST" });
      setSyncVersion((v) => v + 1);
    } finally {
      setTogglingFeedId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4">
        <div className="rounded-xl border border-neutral-200 bg-white p-1">
          <div className="grid w-full min-w-0 grid-cols-4 gap-1">
            {tabs.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                title={t.label}
                className={`flex min-h-[5rem] flex-col items-center justify-center gap-2 rounded-lg py-3 px-1.5 transition sm:min-h-0 sm:flex-row sm:gap-2 sm:py-2.5 sm:px-3 ${
                  tab === t.id ? "bg-neutral-900 text-white" : "text-neutral-600 hover:bg-neutral-100"
                }`}
              >
                <span className="shrink-0">{t.icon}</span>
                <span className={`text-xs font-bold leading-snug text-center sm:text-sm sm:font-semibold sm:text-left ${
                  tab === t.id ? "text-white" : "text-inherit"
                }`}>
                  {t.label}
                </span>
              </button>
            ))}
          </div>
        </div>

        {listings.length > 0 && (
          <div className="flex justify-start">
            <select
              value={listingId ?? ""}
              onChange={(e) => setListingId(e.target.value || null)}
              className="min-w-0 max-w-[280px] rounded-xl border border-neutral-200 bg-white px-3 py-2.5 text-sm font-medium sm:max-w-none"
            >
              {listings.map((l) => (
                <option key={l.id} value={l.id}>{l.title}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {tab === "ical" && (
        <div className="rounded-2xl border border-neutral-200 bg-white p-4 space-y-5">
          {selectedListing ? (
            <>
              <div>
                <div className="text-sm font-semibold text-neutral-800">외부 사이트 캘린더 연동</div>
                <p className="text-xs text-neutral-500 mt-0.5">
                  Airbnb, Booking.com 등에서 제공하는 iCal 주소를 등록한 뒤 <strong>동기화</strong>하면, 해당 일정이 예약 불가로 반영됩니다. 여러 개 등록 가능합니다.
                </p>
                {selectedListing.icalLastSyncedAt && icalFeeds.length === 0 && (
                  <p className="text-xs text-neutral-500 mt-1">
                    마지막 동기화: {formatIsoDateOnly(selectedListing.icalLastSyncedAt)}
                  </p>
                )}
              </div>

              {/* 1단계: 캘린더 등록 */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-neutral-200 text-xs font-bold text-neutral-700">1</span>
                  <span className="text-sm font-medium text-neutral-800">캘린더 등록</span>
                </div>
                <p className="text-xs text-neutral-500 pl-8">이름과 iCal 주소를 입력한 뒤 등록하면 아래 2단계 목록에 추가됩니다.</p>
                <div className="pl-8 flex flex-wrap items-end gap-2">
                  <input
                    type="text"
                    value={newFeedName}
                    onChange={(e) => setNewFeedName(e.target.value)}
                    placeholder="이름 (예: 에어비앤비)"
                    className="w-32 rounded-xl border border-neutral-200 px-3 py-2 text-sm"
                  />
                  <input
                    type="url"
                    value={newFeedUrl}
                    onChange={(e) => setNewFeedUrl(e.target.value)}
                    placeholder="https://..."
                    className="min-w-0 flex-1 rounded-xl border border-neutral-200 px-3 py-2 text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => void handleAddFeed()}
                    disabled={!newFeedUrl.trim()}
                    className="rounded-xl border border-neutral-200 bg-white px-4 py-2 text-sm font-semibold text-neutral-800 hover:bg-neutral-50 disabled:opacity-50"
                  >
                    등록
                  </button>
                </div>
              </div>

              {/* 2단계: 사이트별 동기화 */}
              <div className="space-y-2 pt-1 border-t border-neutral-100">
                <div className="flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-neutral-200 text-xs font-bold text-neutral-700">2</span>
                  <span className="text-sm font-medium text-neutral-800">사이트별 동기화</span>
                </div>
                <p className="text-xs text-neutral-500 pl-8">
                  등록한 캘린더(에어비앤비, 부킹닷컴 등)가 여기 표시됩니다. 오른쪽 <strong>동기화</strong> 버튼을 누르면 일정을 가져와 막힘에 반영됩니다(초록). 다시 누르면 반영 해제(빨강)됩니다.
                </p>
                {displayFeeds.length > 0 ? (
                  <ul className="space-y-2 pl-8">
                    {icalPreview && icalFeeds.length === 0 && (
                      <p className="text-xs text-amber-600 mb-1">테스트 미리보기입니다. URL에 ?icalPreview=1 이 붙어 있습니다.</p>
                    )}
                    {displayFeeds.map((f) => {
                      const syncOn = f.syncEnabled !== false;
                      const isPreview = f.id === "__preview__";
                      return (
                        <li
                          key={f.id}
                          className="flex items-center gap-3 rounded-xl border border-neutral-100 bg-neutral-50/50 px-3 py-2.5 min-w-0"
                        >
                          <div className="min-w-0 flex-1">
                            <div className="font-medium text-neutral-800 truncate">{f.name}</div>
                            <div className="text-xs text-neutral-500 truncate" title={f.url}>{f.url}</div>
                            {f.lastSyncedAt && (
                              <div className="text-xs text-neutral-400 mt-0.5">동기화: {formatIsoDateOnly(f.lastSyncedAt)}</div>
                            )}
                            {f.lastSyncStatus && (
                              <span className="text-xs text-amber-600">{f.lastSyncStatus}</span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            {!isPreview ? (
                              <>
                                <button
                                  type="button"
                                  onClick={() => void handleToggleSync(f.id, syncOn)}
                                  disabled={togglingFeedId === f.id}
                                  title={syncOn ? "반영 중 (다시 누르면 해제)" : "반영 안 함 (누르면 동기화)"}
                                  className={`shrink-0 rounded-xl px-3 py-2 text-xs font-semibold text-white transition-colors duration-200 ${
                                    syncOn
                                      ? "bg-emerald-500 hover:bg-emerald-600"
                                      : "bg-red-500 hover:bg-red-600"
                                  } disabled:opacity-70`}
                                >
                                  {togglingFeedId === f.id ? "…" : "동기화"}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => void handleDeleteFeed(f.id)}
                                  className="p-1.5 rounded-lg hover:bg-red-50 text-neutral-400 hover:text-red-600"
                                  aria-label="삭제"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </>
                            ) : (
                              <>
                                <span className="shrink-0 rounded-xl bg-emerald-500 px-3 py-2 text-xs font-semibold text-white">동기화</span>
                                <span className="text-xs text-neutral-400">미리보기</span>
                              </>
                            )}
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                ) : (
                  <p className="text-xs text-neutral-400 pl-8">등록한 캘린더가 없습니다. 1단계에서 이름과 주소를 입력한 뒤 등록해 주세요.</p>
                )}
              </div>
            </>
          ) : (
            <p className="text-sm text-neutral-500">위에서 숙소를 선택한 뒤 이용해 주세요.</p>
          )}
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
              title="차단일·예약 등 달력 데이터를 다시 불러옵니다"
            >
              캘린더 새로고침
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
                          </span>
                          {!booked && (Number(price) > 0 && !blocked
                            ? <div className="text-[10px] sm:text-xs text-neutral-600 truncate shrink-0">{formatKrw(Number.isFinite(Number(price)) ? Number(price) : 0)}</div>
                            : blocked
                              ? <div className="text-[10px] sm:text-xs shrink-0 min-h-[1em] invisible" aria-hidden="true">0</div>
                              : null)}
                        </div>
                        {!booked && !isPast && (
                          <button
                            type="button"
                            onClick={() => toggleBlock(dateStr)}
                            className={`mt-0.5 rounded px-1.5 py-0.5 w-[2.25rem] text-[10px] font-semibold shrink-0 self-start sm:self-auto text-center transition-colors duration-150 ${
                              blocked
                                ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-300"
                                : "bg-white text-red-600 hover:bg-red-100 border border-red-200"
                            }`}
                            title={blocked ? "판매 재개" : "판매 중지"}
                          >
                            {blocked ? "판매" : "중지"}
                          </button>
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
                            className="mt-1 flex items-center gap-0.5 sm:gap-1 rounded bg-neutral-800 px-1.5 py-0.5 sm:px-2 sm:py-1 text-[9px] sm:text-xs text-white whitespace-nowrap"
                          >
                            <User className="h-2.5 w-2.5 sm:h-3 sm:w-3 shrink-0" />
                            <span className="truncate">예약 확정</span>
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
              onChange={(e) => {
                setBookingFilter(e.target.value);
                setBookingPage(1);
              }}
              className="rounded-lg border border-neutral-200 px-3 py-2 text-sm"
            >
              <option value="">전체</option>
              <option value="CONFIRMED">예약 확정</option>
              <option value="CANCELLED">취소</option>
            </select>
          </div>
          {/* 즉시예약: 결제대기 건은 목록에 미표시, 거절 버튼 없음 */}
          {(() => {
            const displayBookings = allBookings
              .filter((b) => b.status !== "PENDING_PAYMENT")
              .filter((b) => !bookingFilter || b.status === bookingFilter);
            const totalFiltered = displayBookings.length;
            const totalPages = Math.max(1, Math.ceil(totalFiltered / BOOKINGS_PER_PAGE));
            const currentPage = Math.min(Math.max(1, bookingPage), totalPages);
            const paginatedBookings = displayBookings.slice(
              (currentPage - 1) * BOOKINGS_PER_PAGE,
              currentPage * BOOKINGS_PER_PAGE
            );
            return (
          <>
          <div className="space-y-3 sm:space-y-0 sm:overflow-x-auto">
            {/* 모바일 카드 */}
            <div className="sm:hidden space-y-3">
              {paginatedBookings.map((b) => (
                <div
                  key={b.id}
                  className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className="text-sm font-semibold text-neutral-900 truncate min-w-0" title={b.listingTitle}>
                      {b.listingTitle}
                    </span>
                    <span
                      className={`shrink-0 text-xs font-semibold ${
                        b.status === "CONFIRMED"
                          ? "text-emerald-600"
                          : b.status === "CANCELLED"
                            ? "text-red-600"
                            : "text-amber-600"
                      }`}
                    >
                      {getBookingStatusLabel(b)}
                    </span>
                  </div>
                  <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-xs text-neutral-600">
                    <dt className="text-neutral-500">게스트</dt>
                    <dd className="truncate">{b.guestName ?? "게스트"}</dd>
                    <dt className="text-neutral-500">체크인</dt>
                    <dd>{new Date(b.checkIn).toLocaleDateString("ko-KR")}</dd>
                    <dt className="text-neutral-500">체크아웃</dt>
                    <dd>{new Date(b.checkOut).toLocaleDateString("ko-KR")}</dd>
                    <dt className="text-neutral-500">금액</dt>
                    <dd className="font-semibold text-neutral-900">{formatKrw(b.totalKrw)}</dd>
                  </dl>
                  <div className="mt-3 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setModal({ bookingId: b.id, date: new Date(b.checkIn).toISOString().slice(0, 10) })}
                      className="rounded-lg bg-neutral-900 px-3 py-2 text-xs font-semibold text-white hover:bg-neutral-800"
                    >
                      상세
                    </button>
                    {b.status === "CONFIRMED" && (
                      <button
                        type="button"
                        onClick={() => setCancelConfirmBookingId(b.id)}
                        className="rounded-lg border border-red-200 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50"
                      >
                        취소
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
            {/* 데스크톱 테이블 */}
            <table className="hidden sm:table w-full text-sm">
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
                {paginatedBookings.map((b) => (
                  <tr key={b.id} className="border-b border-neutral-100">
                    <td className="py-3 pr-4 max-w-[12rem] truncate" title={b.listingTitle}>{b.listingTitle}</td>
                    <td className="py-3 pr-4 max-w-[8rem] truncate">{b.guestName ?? "게스트"}</td>
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
                        {getBookingStatusLabel(b)}
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
                      {b.status === "CONFIRMED" && (
                        <button
                          type="button"
                          onClick={() => setCancelConfirmBookingId(b.id)}
                          className="text-red-600 text-xs font-medium hover:underline"
                        >
                          취소
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {displayBookings.length === 0 && (
            <p className="py-8 text-center text-neutral-500">예약이 없습니다.</p>
          )}
          {totalFiltered > 0 && (
            <div className="mt-4 flex flex-wrap items-center justify-center gap-1">
              <button
                type="button"
                onClick={() => setBookingPage((p) => Math.max(1, p - 1))}
                disabled={currentPage <= 1}
                className="rounded-lg p-2 text-neutral-600 hover:bg-neutral-100 disabled:opacity-40 disabled:pointer-events-none"
                aria-label="이전 페이지"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setBookingPage(p)}
                  className={`min-w-[2.25rem] rounded-lg py-2 px-2.5 text-sm font-medium ${
                    p === currentPage
                      ? "bg-neutral-900 text-white"
                      : "text-neutral-600 hover:bg-neutral-100"
                  }`}
                >
                  {p}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setBookingPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage >= totalPages}
                className="rounded-lg p-2 text-neutral-600 hover:bg-neutral-100 disabled:opacity-40 disabled:pointer-events-none"
                aria-label="다음 페이지"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          )}
          </>
            );
          })()}
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

      {/* 취소 확인 모달 */}
      {cancelConfirmBookingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" role="dialog" aria-modal="true" aria-labelledby="cancel-confirm-title">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
            <h2 id="cancel-confirm-title" className="text-lg font-semibold text-neutral-900">정말로 취소하시겠습니까?</h2>
            <p className="mt-2 text-sm text-neutral-600">이 예약을 취소하면 게스트에게 환불이 진행됩니다.</p>
            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={() => setCancelConfirmBookingId(null)}
                className="flex-1 rounded-xl border border-neutral-300 py-2.5 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
              >
                아니오
              </button>
              <button
                type="button"
                onClick={async () => {
                  const id = cancelConfirmBookingId;
                  setCancelConfirmBookingId(null);
                  if (!id) return;
                  const res = await fetch(`/api/host/bookings/${id}/cancel`, { method: "POST" });
                  if (res.ok) {
                    setAllBookings((prev) => prev.map((x) => (x.id === id ? { ...x, status: "CANCELLED" as const, cancelledBy: "HOST" } : x)));
                    setSyncVersion((v) => v + 1);
                  }
                }}
                className="flex-1 rounded-xl bg-red-600 py-2.5 text-sm font-medium text-white hover:bg-red-700"
              >
                예, 취소합니다
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
