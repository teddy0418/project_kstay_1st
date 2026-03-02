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

/** KSTAY Black 선정 목록 (관리자용: id, title, sortOrder) */
export async function getKstayBlackListingsForAdmin(): Promise<{ id: string; title: string; city: string; area: string; kstayBlackSortOrder: number }[]> {
  const rows = await prisma.listing.findMany({
    where: { status: "APPROVED", kstayBlackSortOrder: { not: null } },
    select: { id: true, title: true, city: true, area: true, kstayBlackSortOrder: true },
    orderBy: { kstayBlackSortOrder: "asc" },
  });
  return rows
    .filter((r): r is typeof r & { kstayBlackSortOrder: number } => r.kstayBlackSortOrder != null)
    .map((r) => ({ id: r.id, title: r.title, city: r.city, area: r.area, kstayBlackSortOrder: r.kstayBlackSortOrder }));
}

export async function setKstayBlackSortOrder(
  listingId: string,
  sortOrder: number | null
): Promise<boolean> {
  const listing = await prisma.listing.findFirst({
    where: { id: listingId, status: "APPROVED" },
    select: { id: true },
  });
  if (!listing) return false;
  await prisma.listing.update({
    where: { id: listingId },
    data: { kstayBlackSortOrder: sortOrder },
  });
  return true;
}

/** 다음 KSTAY Black 정렬 순서 (기존 최대값 + 1) */
export async function getNextKstayBlackSortOrder(): Promise<number> {
  const max = await prisma.listing.aggregate({
    where: { kstayBlackSortOrder: { not: null } },
    _max: { kstayBlackSortOrder: true },
  });
  return (max._max.kstayBlackSortOrder ?? -1) + 1;
}

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

/** 관리자 검토용: 단일 숙소 전체 정보 + 호스트 프로필 + 서류 URL */
export type AdminListingReview = {
  id: string;
  status: string;
  approvedAt: Date | null;
  createdAt: Date;
  title: string;
  titleKo: string | null;
  titleJa: string | null;
  titleZh: string | null;
  city: string;
  area: string;
  address: string;
  country: string | null;
  stateProvince: string | null;
  cityDistrict: string | null;
  roadAddress: string | null;
  detailedAddress: string | null;
  zipCode: string | null;
  basePriceKrw: number;
  extraGuestFeeKrw: number | null;
  hostBio: string | null;
  hostBioKo: string | null;
  hostBioJa: string | null;
  hostBioZh: string | null;
  checkInTime: string;
  checkOutTime: string | null;
  checkInGuideMessage: string | null;
  houseRulesMessage: string | null;
  amenities: string[];
  propertyType: string | null;
  maxGuests: number | null;
  bedrooms: number | null;
  beds: number | null;
  bathrooms: number | null;
  businessRegistrationDocUrl: string | null;
  lodgingReportDocUrl: string | null;
  images: { id: string; url: string; sortOrder: number }[];
  host: {
    id: string;
    name: string | null;
    email: string | null;
    phone: string | null;
    displayName: string | null;
  };
  hostProfile: {
    displayName: string | null;
    payoutBank: string | null;
    payoutAccount: string | null;
    payoutName: string | null;
  } | null;
};

export async function getAdminListingReview(id: string): Promise<AdminListingReview | null> {
  const row = await prisma.listing.findUnique({
    where: { id },
    select: {
      id: true,
      status: true,
      approvedAt: true,
      createdAt: true,
      title: true,
      titleKo: true,
      titleJa: true,
      titleZh: true,
      city: true,
      area: true,
      address: true,
      country: true,
      stateProvince: true,
      cityDistrict: true,
      roadAddress: true,
      detailedAddress: true,
      zipCode: true,
      basePriceKrw: true,
      extraGuestFeeKrw: true,
      hostBio: true,
      hostBioKo: true,
      hostBioJa: true,
      hostBioZh: true,
      checkInTime: true,
      checkOutTime: true,
      checkInGuideMessage: true,
      houseRulesMessage: true,
      amenities: true,
      propertyType: true,
      maxGuests: true,
      bedrooms: true,
      beds: true,
      bathrooms: true,
      businessRegistrationDocUrl: true,
      lodgingReportDocUrl: true,
      images: { orderBy: { sortOrder: "asc" }, select: { id: true, url: true, sortOrder: true } },
      host: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          displayName: true,
          hostProfile: true,
        },
      },
    },
  });
  if (!row) return null;
  const hostProfile = row.host.hostProfile;
  return {
    id: row.id,
    status: row.status,
    approvedAt: row.approvedAt,
    createdAt: row.createdAt,
    title: row.title,
    titleKo: row.titleKo,
    titleJa: row.titleJa,
    titleZh: row.titleZh,
    city: row.city,
    area: row.area,
    address: row.address,
    country: row.country,
    stateProvince: row.stateProvince,
    cityDistrict: row.cityDistrict,
    roadAddress: row.roadAddress,
    detailedAddress: row.detailedAddress,
    zipCode: row.zipCode,
    basePriceKrw: row.basePriceKrw,
    extraGuestFeeKrw: row.extraGuestFeeKrw,
    hostBio: row.hostBio,
    hostBioKo: row.hostBioKo,
    hostBioJa: row.hostBioJa,
    hostBioZh: row.hostBioZh,
    checkInTime: row.checkInTime,
    checkOutTime: row.checkOutTime,
    checkInGuideMessage: row.checkInGuideMessage,
    houseRulesMessage: row.houseRulesMessage,
    amenities: row.amenities,
    propertyType: row.propertyType,
    maxGuests: row.maxGuests,
    bedrooms: row.bedrooms,
    beds: row.beds,
    bathrooms: row.bathrooms,
    businessRegistrationDocUrl: row.businessRegistrationDocUrl,
    lodgingReportDocUrl: row.lodgingReportDocUrl,
    images: row.images,
    host: {
      id: row.host.id,
      name: row.host.name,
      email: row.host.email,
      phone: row.host.phone,
      displayName: row.host.displayName,
    },
    hostProfile: hostProfile
      ? {
          displayName: hostProfile.displayName,
          payoutBank: hostProfile.payoutBank,
          payoutAccount: hostProfile.payoutAccount,
          payoutName: hostProfile.payoutName,
        }
      : null,
  };
}
