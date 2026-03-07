import { prisma } from "@/lib/db";

export type AdminBookingRow = {
  id: string;
  guestName: string | null;
  guestEmail: string;
  checkIn: Date;
  checkOut: Date;
  nights: number;
  totalKrw: number;
  status: string;
  cancelledBy: string | null;
  updatedAt: Date;
  createdAt: Date;
  listing: { id: string; title: string };
  host: { id: string; name: string | null };
  payment: { status: string; pgTid: string | null } | null;
};

const DEFAULT_PAGE_SIZE = 10;

export async function getAdminBookings(
  statusFilter?: string,
  opts?: { page?: number; pageSize?: number; cancelledBy?: string }
): Promise<{ bookings: AdminBookingRow[]; total: number }> {
  const status = statusFilter && ["PENDING_PAYMENT", "CONFIRMED", "CANCELLED"].includes(statusFilter)
    ? statusFilter
    : undefined;
  const cancelledByFilter =
    opts?.cancelledBy && ["GUEST", "HOST"].includes(opts.cancelledBy) ? opts.cancelledBy : undefined;

  const where: { status?: "PENDING_PAYMENT" | "CONFIRMED" | "CANCELLED"; cancelledBy?: string } = status
    ? { status: status as "PENDING_PAYMENT" | "CONFIRMED" | "CANCELLED" }
    : {};
  if (cancelledByFilter) where.cancelledBy = cancelledByFilter;

  const page = Math.max(1, opts?.page ?? 1);
  const pageSize = Math.min(100, Math.max(1, opts?.pageSize ?? DEFAULT_PAGE_SIZE));
  const skip = (page - 1) * pageSize;

  const [total, rows] = await Promise.all([
    prisma.booking.count({ where }),
    prisma.booking.findMany({
      where,
      select: {
        id: true,
        guestName: true,
        guestEmail: true,
        checkIn: true,
        checkOut: true,
        nights: true,
        totalKrw: true,
        status: true,
        cancelledBy: true,
        updatedAt: true,
        createdAt: true,
        listing: {
          select: {
            id: true,
            title: true,
            host: { select: { id: true, name: true } },
          },
        },
        payments: {
          orderBy: { createdAt: "desc" },
          take: 1,
          select: { status: true, pgTid: true },
        },
      },
      orderBy: { updatedAt: "desc" },
      skip,
      take: pageSize,
    }),
  ]);

  const bookings = rows.map((r) => ({
    id: r.id,
    guestName: r.guestName,
    guestEmail: r.guestEmail,
    checkIn: r.checkIn,
    checkOut: r.checkOut,
    nights: r.nights,
    totalKrw: r.totalKrw,
    status: r.status,
    cancelledBy: r.cancelledBy,
    updatedAt: r.updatedAt,
    createdAt: r.createdAt,
    listing: r.listing ? { id: r.listing.id, title: r.listing.title } : { id: "", title: "" },
    host: r.listing?.host ? { id: r.listing.host.id, name: r.listing.host.name } : { id: "", name: null },
    payment: r.payments[0] ? { status: r.payments[0].status, pgTid: r.payments[0].pgTid } : null,
  }));

  return { bookings, total };
}
