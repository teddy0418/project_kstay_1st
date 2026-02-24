import { prisma } from "@/lib/db";

export type AdminSettlementRow = {
  id: string;
  listingId: string;
  listingTitle: string;
  guestName: string | null;
  host: { id: string; name: string | null };
  checkIn: Date;
  checkOut: Date;
  nights: number;
  totalKrw: number;
  pgTid: string | null;
  paymentStatus: string;
  /** 체크인(KST 15:00) + 24시간 경과 시각 */
  readyAt: Date;
};

export async function getAdminSettlementRows(): Promise<AdminSettlementRow[]> {
  const rows = await prisma.booking.findMany({
    where: { status: "CONFIRMED" },
    select: {
      id: true,
      guestName: true,
      checkIn: true,
      checkOut: true,
      nights: true,
      totalKrw: true,
      listingId: true,
      listing: { select: { title: true, host: { select: { id: true, name: true } } } },
      payments: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { status: true, pgTid: true },
      },
    },
    orderBy: { checkIn: "asc" },
  });

  return rows.map((r) => {
    const payment = r.payments[0];
    const checkInDate = new Date(r.checkIn);
    const readyAt = new Date(checkInDate.getTime() + 24 * 60 * 60 * 1000);
    return {
      id: r.id,
      listingId: r.listingId,
      listingTitle: r.listing?.title ?? "",
      guestName: r.guestName,
      host: r.listing?.host ? { id: r.listing.host.id, name: r.listing.host.name } : { id: "", name: null },
      checkIn: r.checkIn,
      checkOut: r.checkOut,
      nights: r.nights,
      totalKrw: r.totalKrw,
      pgTid: payment?.pgTid ?? null,
      paymentStatus: payment?.status ?? "",
      readyAt,
    };
  });
}
