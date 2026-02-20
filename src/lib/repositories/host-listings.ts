import { prisma } from "@/lib/db";

type CreateHostListingInput = {
  userId: string;
  userName: string | null;
  isAdmin: boolean;
  title: string;
  city: string;
  area: string;
  address: string;
  basePriceKrw: number;
  checkInTime?: string;
  hostBio: string | null;
  hostBioKo: string | null;
  hostBioJa: string | null;
  hostBioZh: string | null;
};

type UpdateHostListingInput = {
  id: string;
  title?: string;
  city?: string;
  area?: string;
  address?: string;
  basePriceKrw?: number;
  status?: "PENDING" | "APPROVED" | "REJECTED";
  hostBio?: string;
  hostBioKo?: string;
  hostBioJa?: string;
  hostBioZh?: string;
};

export async function createPendingHostListing(input: CreateHostListingInput) {
  await prisma.hostProfile.upsert({
    where: { userId: input.userId },
    create: { userId: input.userId, displayName: input.userName ?? "Host" },
    update: { displayName: input.userName ?? "Host" },
  });

  if (!input.isAdmin) {
    await prisma.user.update({
      where: { id: input.userId },
      data: { role: "HOST" },
    });
  }

  return prisma.listing.create({
    data: {
      hostId: input.userId,
      title: input.title,
      city: input.city,
      area: input.area,
      address: input.address,
      location: `${input.city} · ${input.area}`,
      basePriceKrw: input.basePriceKrw,
      status: "PENDING",
      checkInTime: input.checkInTime || "15:00",
      hostBio: input.hostBio,
      hostBioKo: input.hostBioKo,
      hostBioJa: input.hostBioJa,
      hostBioZh: input.hostBioZh,
      images: {
        create: [
          {
            url: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1600&q=80",
            sortOrder: 0,
          },
        ],
      },
    },
    select: { id: true, status: true },
  });
}

export async function findHostListingOwnership(id: string) {
  return prisma.listing.findUnique({
    where: { id },
    select: { id: true, hostId: true },
  });
}

export async function updateHostListing(input: UpdateHostListingInput) {
  const normalizedHostBio = input.hostBio === "" ? null : input.hostBio;
  const normalizedHostBioKo = input.hostBioKo === "" ? null : input.hostBioKo;
  const normalizedHostBioJa = input.hostBioJa === "" ? null : input.hostBioJa;
  const normalizedHostBioZh = input.hostBioZh === "" ? null : input.hostBioZh;

  return prisma.listing.update({
    where: { id: input.id },
    data: {
      title: input.title,
      city: input.city,
      area: input.area,
      address: input.address,
      basePriceKrw: input.basePriceKrw !== undefined ? Math.floor(input.basePriceKrw) : undefined,
      status: input.status,
      location: input.city && input.area ? `${input.city} · ${input.area}` : undefined,
      hostBio: normalizedHostBio,
      hostBioKo: normalizedHostBioKo,
      hostBioJa: normalizedHostBioJa,
      hostBioZh: normalizedHostBioZh,
    },
    select: {
      id: true,
      title: true,
      city: true,
      area: true,
      address: true,
      basePriceKrw: true,
      status: true,
    },
  });
}
