import { prisma } from "@/lib/db";

export type HostCalendarListing = {
  id: string;
  title: string;
  basePriceKrw: number;
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
    select: { id: true, title: true, basePriceKrw: true },
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

export async function getBlockedDates(listingId: string, from: Date, to: Date): Promise<string[]> {
  const rows = await prisma.listingBlockedDate.findMany({
    where: { listingId, date: { gte: from, lte: to } },
    select: { date: true },
  });
  return rows.map((r) => r.date.toISOString().slice(0, 10));
}

export async function blockDate(listingId: string, hostId: string, date: Date): Promise<void> {
  await prisma.listing.findFirstOrThrow({ where: { id: listingId, hostId } });
  const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());
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
  const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());
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
