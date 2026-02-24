import { prisma } from "@/lib/db";

const statusMap = {
  DRAFT: "DRAFT" as const,
  PENDING: "PENDING" as const,
  APPROVED: "APPROVED" as const,
  REJECTED: "REJECTED" as const,
};

export type AdminListingRow = {
  id: string;
  title: string;
  city: string;
  area: string;
  address: string;
  basePriceKrw: number;
  status: string;
  approvedAt: Date | null;
  createdAt: Date;
  host: { id: string; name: string | null };
};

export async function getAdminListings(statusFilter?: string): Promise<AdminListingRow[]> {
  const status = statusFilter && statusMap[statusFilter as keyof typeof statusMap];
  const where = status ? { status } : {};

  const rows = await prisma.listing.findMany({
    where,
    select: {
      id: true,
      title: true,
      city: true,
      area: true,
      address: true,
      basePriceKrw: true,
      status: true,
      approvedAt: true,
      createdAt: true,
      host: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return rows.map((r) => ({
    id: r.id,
    title: r.title,
    city: r.city,
    area: r.area,
    address: r.address,
    basePriceKrw: r.basePriceKrw,
    status: r.status,
    approvedAt: r.approvedAt,
    createdAt: r.createdAt,
    host: r.host,
  }));
}
