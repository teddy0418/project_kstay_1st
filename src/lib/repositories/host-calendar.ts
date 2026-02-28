import { prisma } from "@/lib/db";

export type HostCalendarListing = {
  id: string;
  title: string;
  basePriceKrw: number;
  icalUrl: string | null;
  icalLastSyncedAt: Date | null;
};

export type HostCalendarBooking = {
  id: string;
  listingId: string;
  guestName: string | null;
  checkIn: Date;
  checkOut: Date;
  nights: number;
  guestsAdults: number;
  guestsChildren: number;
  guestsInfants: number;
  guestsPets: number;
  status: string;
  totalKrw: number;
  listingTitle: string;
};

export async function getHostListingsForCalendar(hostId: string): Promise<HostCalendarListing[]> {
  const rows = await prisma.listing.findMany({
    where: { hostId, status: "APPROVED" },
    select: { id: true, title: true, basePriceKrw: true, icalUrl: true, icalLastSyncedAt: true },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  return rows;
}

export async function getHostBookingsForMonth(
  hostId: string,
  listingId: string,
  year: number,
  month: number
): Promise<HostCalendarBooking[]> {
  const monthStart = new Date(year, month - 1, 1);
  const monthEnd = new Date(year, month, 0, 23, 59, 59, 999);

  const rows = await prisma.booking.findMany({
    where: {
      listingId,
      listing: { hostId },
      status: { in: ["CONFIRMED", "PENDING_PAYMENT"] },
      checkIn: { lte: monthEnd },
      checkOut: { gte: monthStart },
    },
    select: {
      id: true,
      listingId: true,
      guestName: true,
      checkIn: true,
      checkOut: true,
      nights: true,
      guestsAdults: true,
      guestsChildren: true,
      guestsInfants: true,
      guestsPets: true,
      status: true,
      totalKrw: true,
      listing: { select: { title: true } },
    },
    orderBy: { checkIn: "asc" },
  });

  return rows.map((r) => ({
    id: r.id,
    listingId: r.listingId,
    guestName: r.guestName,
    checkIn: r.checkIn,
    checkOut: r.checkOut,
    nights: r.nights,
    guestsAdults: r.guestsAdults,
    guestsChildren: r.guestsChildren,
    guestsInfants: r.guestsInfants,
    guestsPets: r.guestsPets,
    status: r.status,
    totalKrw: r.totalKrw,
    listingTitle: r.listing.title,
  }));
}

export async function getHostBookingsForList(
  hostId: string,
  opts: { listingId?: string; status?: string }
): Promise<HostCalendarBooking[]> {
  const rows = await prisma.booking.findMany({
    where: {
      listing: { hostId },
      ...(opts.listingId && { listingId: opts.listingId }),
      ...(opts.status && { status: opts.status as "CONFIRMED" | "PENDING_PAYMENT" | "CANCELLED" }),
    },
    select: {
      id: true,
      listingId: true,
      guestName: true,
      checkIn: true,
      checkOut: true,
      nights: true,
      guestsAdults: true,
      guestsChildren: true,
      guestsInfants: true,
      guestsPets: true,
      status: true,
      totalKrw: true,
      listing: { select: { title: true } },
    },
    orderBy: { checkIn: "desc" },
    take: 200,
  });
  return rows.map((r) => ({
    id: r.id,
    listingId: r.listingId,
    guestName: r.guestName,
    checkIn: r.checkIn,
    checkOut: r.checkOut,
    nights: r.nights,
    guestsAdults: r.guestsAdults,
    guestsChildren: r.guestsChildren,
    guestsInfants: r.guestsInfants,
    guestsPets: r.guestsPets,
    status: r.status,
    totalKrw: r.totalKrw,
    listingTitle: r.listing.title,
  }));
}

/** 호스트 대시보드 요약: 오늘 입실/퇴실, 신규 취소, 정산 예정액 등 */
export type HostDashboardStats = {
  todayCheckIn: number;
  todayCheckOut: number;
  newMessages: number;
  newCancels: number;
  pendingSettlementKrw: number;
};

function startOfDayLocal(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
}

function endOfDayLocal(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);
}

export async function getHostDashboardStats(hostId: string, listingId?: string | null): Promise<HostDashboardStats> {
  const now = new Date();
  const todayStart = startOfDayLocal(now);
  const todayEnd = endOfDayLocal(now);
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const baseWhere = { listing: { hostId }, ...(listingId ? { listingId } : {}) };

  const [todayCheckInRows, todayCheckOutRows, cancelledRows, confirmedRows] = await Promise.all([
    prisma.booking.count({
      where: {
        ...baseWhere,
        status: { in: ["CONFIRMED", "PENDING_PAYMENT"] },
        checkIn: { gte: todayStart, lte: todayEnd },
      },
    }),
    prisma.booking.count({
      where: {
        ...baseWhere,
        status: "CONFIRMED",
        checkOut: { gte: todayStart, lte: todayEnd },
      },
    }),
    prisma.booking.count({
      where: {
        ...baseWhere,
        status: "CANCELLED",
        updatedAt: { gte: sevenDaysAgo },
      },
    }),
    prisma.booking.findMany({
      where: { ...baseWhere, status: "CONFIRMED" },
      select: { accommodationKrw: true, totalKrw: true },
    }),
  ]);

  const pendingSettlementKrw = confirmedRows.reduce(
    (sum, r) => sum + (r.accommodationKrw ?? Math.round((r.totalKrw ?? 0) / 1.12)),
    0
  );

  return {
    todayCheckIn: todayCheckInRows,
    todayCheckOut: todayCheckOutRows,
    newMessages: 0,
    newCancels: cancelledRows,
    pendingSettlementKrw,
  };
}

/** 이번 주(오늘 포함 7일) 일별 예약 현황: 예약 여부 + 판매 중지 여부 */
export type HostWeekTimelineRow = {
  date: string;
  dateLabel: string;
  guestName?: string;
  status: "BOOKED" | "EMPTY";
  /** 빈방인데 호스트가 판매 중지한 날이면 true */
  isBlocked: boolean;
  /** 오늘 이전 날짜면 true (지난 날짜 구분용) */
  isPast: boolean;
};

function formatDateLabel(d: Date): string {
  return new Intl.DateTimeFormat("ko-KR", { month: "numeric", day: "numeric", weekday: "short" }).format(d);
}

/** API/DB와 동일한 날짜 키: YYYY-MM-DD (캘린더·대시보드 연동용) */
function toUtcDateString(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/** 로컬 날짜를 YYYY-MM-DD로 (대시보드·캘린더 셀 키와 동일하게) */
function toLocalDateString(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export async function getHostWeekTimeline(hostId: string, listingId?: string | null): Promise<HostWeekTimelineRow[]> {
  const today = new Date();
  const weekStart = startOfDayLocal(today);
  const weekEnd = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 7, 0, 0, 0, 0);

  const listingWhere = listingId ? { listingId, listing: { hostId } } : { listing: { hostId } };

  const weekFirstUtc = new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()));
  const weekLastUtc = new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate() + 6, 23, 59, 59, 999));

  const bookingsPromise = prisma.booking.findMany({
    where: {
      ...listingWhere,
      status: { in: ["CONFIRMED", "PENDING_PAYMENT"] },
      checkIn: { lt: weekEnd },
      checkOut: { gt: weekStart },
    },
    select: { checkIn: true, checkOut: true, guestName: true },
    orderBy: { checkIn: "asc" },
  });

  const blockedDatesPromise =
    listingId
      ? getBlockedDates(listingId, weekFirstUtc, weekLastUtc)
      : prisma.listingBlockedDate.findMany({
          where: { listing: { hostId }, date: { gte: weekFirstUtc, lte: weekLastUtc } },
          select: { date: true },
        }).then((rows) => {
          const toKey = (d: Date) =>
            `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
          return [...new Set(rows.map((r) => toKey(r.date)))];
        });

  const [bookings, blockedDateList] = await Promise.all([bookingsPromise, blockedDatesPromise]);
  const blockedDateSet = new Set(blockedDateList);

  const todayStr = toLocalDateString(today);
  const rows: HostWeekTimelineRow[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(today.getFullYear(), today.getMonth(), today.getDate() + i, 0, 0, 0, 0);
    const dayStart = startOfDayLocal(d);
    const dayEnd = endOfDayLocal(d);

    const overlapping = bookings.find(
      (b) => b.checkIn <= dayEnd && b.checkOut > dayStart
    );
    const dateStr = toLocalDateString(d);
    const isPast = dateStr < todayStr;
    rows.push({
      date: dateStr,
      dateLabel: formatDateLabel(d),
      guestName: overlapping?.guestName ?? undefined,
      status: overlapping ? "BOOKED" : "EMPTY",
      isBlocked: blockedDateSet.has(dateStr),
      isPast,
    });
  }
  return rows;
}

export async function getBlockedDates(listingId: string, from: Date, to: Date): Promise<string[]> {
  const manualRows = await prisma.listingBlockedDate.findMany({
    where: { listingId, date: { gte: from, lte: to } },
    select: { date: true },
  });

  let icalRows: { date: Date }[] = [];
  try {
    icalRows = await prisma.listingIcalBlockedDate.findMany({
      where: { listingId, date: { gte: from, lte: to } },
      select: { date: true },
    });
  } catch {
    icalRows = [];
  }

  const toDateKey = (d: Date) => {
    const y = d.getUTCFullYear();
    const m = String(d.getUTCMonth() + 1).padStart(2, "0");
    const day = String(d.getUTCDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  };
  const set = new Set<string>();
  for (const r of manualRows) set.add(toDateKey(r.date));
  for (const r of icalRows) set.add(toDateKey(r.date));
  return Array.from(set).sort();
}

/** UTC 0시 기준 날짜만 사용 (Postgres date 컬럼과 일치) */
function toUtcDateOnly(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

export async function blockDate(listingId: string, hostId: string, date: Date): Promise<void> {
  await prisma.listing.findFirstOrThrow({ where: { id: listingId, hostId } });
  const dateOnly = toUtcDateOnly(date);
  await prisma.listingBlockedDate.upsert({
    where: {
      listingId_date: { listingId, date: dateOnly },
    },
    create: { listingId, date: dateOnly },
    update: {},
  });
}

export async function unblockDate(listingId: string, hostId: string, date: Date): Promise<void> {
  await prisma.listing.findFirstOrThrow({ where: { id: listingId, hostId } });
  const dateOnly = toUtcDateOnly(date);
  await prisma.listingBlockedDate.deleteMany({
    where: { listingId, date: dateOnly },
  });
}

export async function getDatePrices(listingId: string, from: Date, to: Date): Promise<{ date: string; priceKrw: number }[]> {
  const rows = await prisma.listingDatePrice.findMany({
    where: { listingId, date: { gte: from, lte: to } },
    select: { date: true, priceKrw: true },
  });
  return rows.map((r) => ({ date: r.date.toISOString().slice(0, 10), priceKrw: r.priceKrw }));
}

export async function setDatePrice(listingId: string, hostId: string, date: Date, priceKrw: number): Promise<void> {
  await prisma.listing.findFirstOrThrow({ where: { id: listingId, hostId } });
  const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  await prisma.listingDatePrice.upsert({
    where: { listingId_date: { listingId, date: dateOnly } },
    create: { listingId, date: dateOnly, priceKrw },
    update: { priceKrw },
  });
}

export type ListingIcalFeedSummary = {
  id: string;
  name: string;
  url: string;
  color: string | null;
  lastSyncedAt: Date | null;
  lastSyncStatus: string | null;
};

export async function getListingIcalFeed(
  hostId: string,
  listingId: string
): Promise<ListingIcalFeedSummary | null> {
  const feed = await prisma.listingIcalFeed.findFirst({
    where: {
      listingId,
      listing: { hostId },
    },
    orderBy: { createdAt: "asc" },
  });
  if (!feed) return null;
  return {
    id: feed.id,
    name: feed.name,
    url: feed.url,
    color: feed.color ?? null,
    lastSyncedAt: feed.lastSyncedAt ?? null,
    lastSyncStatus: feed.lastSyncStatus ?? null,
  };
}

export async function upsertListingIcalFeedAndSync(args: {
  hostId: string;
  listingId: string;
  url: string;
  name?: string;
}): Promise<{ feed: ListingIcalFeedSummary; blockedDates: string[] }> {
  const { hostId, listingId } = args;
  const url = args.url.trim();
  if (!url) {
    throw new Error("iCal URL is required");
  }
  const name = (args.name ?? "외부 캘린더").trim() || "외부 캘린더";

  // 소유권 확인
  await prisma.listing.findFirstOrThrow({ where: { id: listingId, hostId } });

  const now = new Date();

  let blockedDateKeys: string[] = [];
  let status: string | null = null;

  try {
    const { fetchIcalBlockedDates } = await import("@/lib/ical");
    blockedDateKeys = await fetchIcalBlockedDates(url);
  } catch (e) {
    status =
      e instanceof Error
        ? e.message
        : "iCal 캘린더를 불러오는 중 오류가 발생했습니다.";
  }

  const feedRecord = await prisma.listingIcalFeed.upsert({
    where: { listingId_url: { listingId, url } },
    update: {
      name,
      lastSyncedAt: status ? undefined : now,
      lastSyncStatus: status,
    },
    create: {
      listingId,
      name,
      url,
      lastSyncedAt: status ? null : now,
      lastSyncStatus: status,
    },
  });

  if (!status) {
    // 기존 iCal 차단일을 모두 지우고, 새로 동기화
    const dateRows = blockedDateKeys.map((key) => {
      const [y, m, d] = key.split("-").map((v) => parseInt(v, 10));
      const date = new Date(y, (m || 1) - 1, d || 1);
      return { listingId, date };
    });

    await prisma.$transaction([
      prisma.listingIcalBlockedDate.deleteMany({ where: { listingId } }),
      dateRows.length
        ? prisma.listingIcalBlockedDate.createMany({
            data: dateRows,
            skipDuplicates: true,
          })
        : prisma.listingIcalBlockedDate.deleteMany({ where: { listingId } }),
    ]);
  }

  const feed: ListingIcalFeedSummary = {
    id: feedRecord.id,
    name: feedRecord.name,
    url: feedRecord.url,
    color: feedRecord.color ?? null,
    lastSyncedAt: feedRecord.lastSyncedAt ?? null,
    lastSyncStatus: feedRecord.lastSyncStatus ?? null,
  };

  return { feed, blockedDates: blockedDateKeys };
}

export type BookingDetailForHost = {
  id: string;
  listingId: string;
  listingTitle: string;
  guestName: string | null;
  checkIn: Date;
  checkOut: Date;
  nights: number;
  status: string;
  totalKrw: number;
  guestPayment: { accommodationKrw: number; guestServiceFee: number; totalKrw: number };
  hostPayout: { accommodationKrw: number; totalKrw: number };
};

export async function getBookingDetailForHost(bookingId: string, hostId: string): Promise<BookingDetailForHost | null> {
  const b = await prisma.booking.findFirst({
    where: { id: bookingId, listing: { hostId } },
    select: {
      id: true,
      listingId: true,
      listing: { select: { title: true } },
      guestName: true,
      checkIn: true,
      checkOut: true,
      nights: true,
      status: true,
      totalKrw: true,
    },
  });
  if (!b) return null;

  const totalKrw = b.totalKrw;
  // totalKrw 기준 역산 (DB에 accommodationKrw/guestServiceFeeKrw 없어도 동작)
  const accommodationKrw = Math.round(totalKrw / 1.12);
  const guestServiceFee = totalKrw - accommodationKrw;

  return {
    id: b.id,
    listingId: b.listingId,
    listingTitle: b.listing.title,
    guestName: b.guestName,
    checkIn: b.checkIn,
    checkOut: b.checkOut,
    nights: b.nights,
    status: b.status,
    totalKrw: b.totalKrw,
    guestPayment: {
      accommodationKrw,
      guestServiceFee,
      totalKrw,
    },
    hostPayout: {
      accommodationKrw,
      totalKrw: accommodationKrw,
    },
  };
}
