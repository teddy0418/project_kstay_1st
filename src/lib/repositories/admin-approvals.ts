import { prisma } from "@/lib/db";

const approvalItemSelect = {
  id: true,
  title: true,
  city: true,
  area: true,
  address: true,
  basePriceKrw: true,
  status: true,
  approvedAt: true,
  createdAt: true,
  host: {
    select: {
      id: true,
      name: true,
      role: true,
    },
  },
} as const;

export async function getPendingApprovalItems() {
  return prisma.listing.findMany({
    where: { status: "PENDING" },
    select: approvalItemSelect,
    orderBy: { createdAt: "asc" },
  });
}

export async function findApprovalListingById(id: string) {
  return prisma.listing.findUnique({
    where: { id },
    select: { id: true, status: true },
  });
}

export async function approveListingById(id: string) {
  return prisma.listing.update({
    where: { id },
    data: { status: "APPROVED", approvedAt: new Date() },
    select: { id: true, status: true, approvedAt: true },
  });
}

export async function rejectListingById(id: string) {
  return prisma.listing.update({
    where: { id },
    data: { status: "REJECTED" },
    select: { id: true, status: true },
  });
}
