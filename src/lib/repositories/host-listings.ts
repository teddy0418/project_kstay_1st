import { prisma } from "@/lib/db";

type CreateHostListingInput = {
  userId: string;
  userName: string | null;
  isAdmin: boolean;
  title: string;
  titleKo?: string | null;
  titleJa?: string | null;
  titleZh?: string | null;
  city: string;
  area: string;
  address: string;
  basePriceKrw: number;
  checkInTime?: string;
  checkOutTime?: string | null;
  hostBio: string | null;
  hostBioKo: string | null;
  hostBioJa: string | null;
  hostBioZh: string | null;
  /** DRAFT = 초안 저장, PENDING = 검토 요청 (기본) */
  status?: "DRAFT" | "PENDING";
};

type UpdateHostListingInput = {
  id: string;
  title?: string;
  titleKo?: string | null;
  titleJa?: string | null;
  titleZh?: string | null;
  city?: string;
  area?: string;
  address?: string;
  basePriceKrw?: number;
  status?: "DRAFT" | "PENDING" | "APPROVED" | "REJECTED";
  checkInTime?: string | null;
  checkOutTime?: string | null;
  checkInGuideMessage?: string | null;
  houseRulesMessage?: string | null;
  hostBio?: string;
  hostBioKo?: string;
  hostBioJa?: string;
  hostBioZh?: string;
  lat?: number | null;
  lng?: number | null;
  amenities?: string[];
  propertyType?: string | null;
  maxGuests?: number | null;
  country?: string | null;
  stateProvince?: string | null;
  cityDistrict?: string | null;
  roadAddress?: string | null;
  detailedAddress?: string | null;
  zipCode?: string | null;
  weekendSurchargePct?: number | null;
  peakSurchargePct?: number | null;
  nonRefundableSpecialEnabled?: boolean;
  freeCancellationDays?: number | null;
  extraGuestFeeKrw?: number | null;
  businessRegistrationDocUrl?: string | null;
  lodgingReportDocUrl?: string | null;
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

  const status = input.status ?? "PENDING";

  return prisma.listing.create({
    data: {
      hostId: input.userId,
      title: input.title,
      titleKo: input.titleKo ?? undefined,
      titleJa: input.titleJa ?? undefined,
      titleZh: input.titleZh ?? undefined,
      city: input.city,
      area: input.area,
      address: input.address,
      location: `${input.city} · ${input.area}`,
      basePriceKrw: input.basePriceKrw,
      status,
      checkInTime: input.checkInTime || "15:00",
      checkOutTime: input.checkOutTime ?? undefined,
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
    select: { id: true, hostId: true, status: true },
  });
}

/** 승인(APPROVED)된 숙소에서 호스트가 수정 가능한 필드만 */
export const APPROVED_LISTING_EDITABLE_FIELDS = [
  "checkInGuideMessage",
  "houseRulesMessage",
  "detailedAddress",
] as const;

/** 편집 진입 시 첫 미완료 단계 계산용 최소 필드만 조회. hostId 있으면 본인 것만 */
export async function findListingMinimalForWizardStep(id: string, hostId?: string | null) {
  const where = hostId != null ? { id, hostId } : { id };
  const row = await prisma.listing.findFirst({
    where,
    select: {
      title: true,
      titleKo: true,
      address: true,
      roadAddress: true,
      lat: true,
      lng: true,
      basePriceKrw: true,
      propertyType: true,
      maxGuests: true,
      amenities: true,
      images: { select: { id: true } },
    },
  });
  if (!row) return null;
  return {
    ...row,
    images: row.images as { id: string; url?: string; sortOrder?: number }[],
  };
}

/** 호스트의 DRAFT 상태 리스팅 중 가장 최근 1건 id (위저드 재사용용) */
export async function findFirstDraftListingId(hostId: string): Promise<string | null> {
  const row = await prisma.listing.findFirst({
    where: { hostId, status: "DRAFT" },
    select: { id: true },
    orderBy: { updatedAt: "desc" },
  });
  return row?.id ?? null;
}

/** 호스트 자신의 리스팅 목록(목록 페이지용) */
export async function listHostListings(hostId: string) {
  return prisma.listing.findMany({
    where: { hostId },
    select: { id: true, title: true, status: true, city: true, area: true, createdAt: true },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
}

/** 편집용 단건 로딩. hostId 있으면 본인만, 없으면 id만(ADMIN용). */
export async function findHostListingForEdit(id: string, hostId?: string) {
  return prisma.listing.findFirst({
    where: hostId != null ? { id, hostId } : { id },
    select: {
      id: true,
      status: true,
      title: true,
      titleKo: true,
      titleJa: true,
      titleZh: true,
      city: true,
      area: true,
      address: true,
      basePriceKrw: true,
      checkInTime: true,
      checkOutTime: true,
      checkInGuideMessage: true,
      houseRulesMessage: true,
      hostBio: true,
      hostBioKo: true,
      hostBioJa: true,
      hostBioZh: true,
      propertyType: true,
      maxGuests: true,
      country: true,
      stateProvince: true,
      cityDistrict: true,
      roadAddress: true,
      detailedAddress: true,
      zipCode: true,
      weekendSurchargePct: true,
      peakSurchargePct: true,
      nonRefundableSpecialEnabled: true,
      freeCancellationDays: true,
      extraGuestFeeKrw: true,
      businessRegistrationDocUrl: true,
      lodgingReportDocUrl: true,
      amenities: true,
      lat: true,
      lng: true,
      location: true,
      images: {
        orderBy: { sortOrder: "asc" },
        select: { id: true, url: true, sortOrder: true },
      },
    },
  });
}

export async function countListingImages(listingId: string): Promise<number> {
  return prisma.listingImage.count({ where: { listingId } });
}

export async function addListingImage(listingId: string, url: string, sortOrder?: number) {
  const maxOrder = await prisma.listingImage.aggregate({
    where: { listingId },
    _max: { sortOrder: true },
  });
  const nextOrder = sortOrder ?? (maxOrder._max.sortOrder ?? -1) + 1;
  return prisma.listingImage.create({
    data: { listingId, url, sortOrder: nextOrder },
    select: { id: true, url: true, sortOrder: true },
  });
}

export async function deleteListingImage(imageId: string, listingId: string) {
  return prisma.listingImage.deleteMany({
    where: { id: imageId, listingId },
  });
}

export async function reorderListingImages(listingId: string, imageIds: string[]) {
  await prisma.$transaction(
    imageIds.map((id, index) =>
      prisma.listingImage.updateMany({
        where: { id, listingId },
        data: { sortOrder: index },
      })
    )
  );
  return prisma.listingImage.findMany({
    where: { listingId },
    select: { id: true, url: true, sortOrder: true },
    orderBy: { sortOrder: "asc" },
  });
}

/** 해당 리스팅의 예약 건수. 삭제 가능 여부 판단용 */
export async function countListingBookings(listingId: string): Promise<number> {
  return prisma.booking.count({ where: { listingId } });
}

/**
 * DRAFT 또는 REJECTED 상태이고 예약이 0건일 때만 삭제.
 * 이미지는 cascade로 함께 삭제되므로 먼저 deleteMany 후 Listing delete.
 */
export async function deleteHostListing(listingId: string, hostId: string): Promise<{ ok: true } | { ok: false; code: string; message: string }> {
  const listing = await prisma.listing.findFirst({
    where: { id: listingId, hostId },
    select: { id: true, status: true },
  });
  if (!listing) return { ok: false, code: "NOT_FOUND", message: "Listing not found" };
  if (listing.status !== "DRAFT" && listing.status !== "REJECTED") {
    return { ok: false, code: "DELETE_NOT_ALLOWED", message: "검토 중이거나 승인된 숙소는 삭제할 수 없습니다." };
  }
  const bookingCount = await countListingBookings(listingId);
  if (bookingCount > 0) {
    return { ok: false, code: "HAS_BOOKINGS", message: "예약이 있는 숙소는 삭제할 수 없습니다." };
  }
  await prisma.$transaction([
    prisma.listingImage.deleteMany({ where: { listingId } }),
    prisma.listing.delete({ where: { id: listingId } }),
  ]);
  return { ok: true };
}

export async function updateHostListing(input: UpdateHostListingInput) {
  const normalizedHostBio = input.hostBio === "" ? null : input.hostBio;
  const normalizedHostBioKo = input.hostBioKo === "" ? null : input.hostBioKo;
  const normalizedHostBioJa = input.hostBioJa === "" ? null : input.hostBioJa;
  const normalizedHostBioZh = input.hostBioZh === "" ? null : input.hostBioZh;

  const data: Parameters<typeof prisma.listing.update>[0]["data"] = {};
  if (input.title !== undefined) data.title = input.title;
  if (input.titleKo !== undefined) data.titleKo = input.titleKo;
  if (input.titleJa !== undefined) data.titleJa = input.titleJa;
  if (input.titleZh !== undefined) data.titleZh = input.titleZh;
  if (input.city !== undefined) data.city = input.city;
  if (input.area !== undefined) data.area = input.area;
  if (input.address !== undefined) data.address = input.address;
  if (input.basePriceKrw !== undefined) data.basePriceKrw = Math.floor(input.basePriceKrw);
  if (input.status !== undefined) data.status = input.status;
  if (input.checkInTime !== undefined) data.checkInTime = input.checkInTime ?? undefined;
  if (input.checkOutTime !== undefined) data.checkOutTime = input.checkOutTime ?? undefined;
  if (input.checkInGuideMessage !== undefined) data.checkInGuideMessage = input.checkInGuideMessage ?? undefined;
  if (input.houseRulesMessage !== undefined) data.houseRulesMessage = input.houseRulesMessage ?? undefined;
  if (input.city !== undefined && input.area !== undefined) data.location = `${input.city} · ${input.area}`;
  if (input.hostBio !== undefined) data.hostBio = normalizedHostBio;
  if (input.hostBioKo !== undefined) data.hostBioKo = normalizedHostBioKo;
  if (input.hostBioJa !== undefined) data.hostBioJa = normalizedHostBioJa;
  if (input.hostBioZh !== undefined) data.hostBioZh = normalizedHostBioZh;
  if (input.lat !== undefined) data.lat = input.lat;
  if (input.lng !== undefined) data.lng = input.lng;
  if (input.amenities !== undefined) data.amenities = input.amenities;
  if (input.propertyType !== undefined) data.propertyType = input.propertyType ?? null;
  if (input.maxGuests !== undefined) data.maxGuests = input.maxGuests ?? null;
  if (input.country !== undefined) data.country = input.country ?? null;
  if (input.stateProvince !== undefined) data.stateProvince = input.stateProvince ?? null;
  if (input.cityDistrict !== undefined) data.cityDistrict = input.cityDistrict ?? null;
  if (input.roadAddress !== undefined) data.roadAddress = input.roadAddress ?? null;
  if (input.detailedAddress !== undefined) data.detailedAddress = input.detailedAddress ?? null;
  if (input.zipCode !== undefined) data.zipCode = input.zipCode ?? null;
  if (input.weekendSurchargePct !== undefined) data.weekendSurchargePct = input.weekendSurchargePct ?? null;
  if (input.peakSurchargePct !== undefined) data.peakSurchargePct = input.peakSurchargePct ?? null;
  if (input.nonRefundableSpecialEnabled !== undefined) data.nonRefundableSpecialEnabled = input.nonRefundableSpecialEnabled;
  if (input.freeCancellationDays !== undefined) data.freeCancellationDays = input.freeCancellationDays ?? null;
  if (input.extraGuestFeeKrw !== undefined) data.extraGuestFeeKrw = input.extraGuestFeeKrw ?? null;
  if (input.businessRegistrationDocUrl !== undefined) data.businessRegistrationDocUrl = input.businessRegistrationDocUrl ?? null;
  if (input.lodgingReportDocUrl !== undefined) data.lodgingReportDocUrl = input.lodgingReportDocUrl ?? null;

  return prisma.listing.update({
    where: { id: input.id },
    data,
    select: {
      id: true,
      status: true,
      title: true,
      titleKo: true,
      titleJa: true,
      titleZh: true,
      city: true,
      area: true,
      address: true,
      basePriceKrw: true,
      checkInTime: true,
      checkOutTime: true,
      checkInGuideMessage: true,
      houseRulesMessage: true,
      hostBio: true,
      hostBioKo: true,
      hostBioJa: true,
      hostBioZh: true,
      propertyType: true,
      maxGuests: true,
      country: true,
      stateProvince: true,
      cityDistrict: true,
      roadAddress: true,
      detailedAddress: true,
      zipCode: true,
      weekendSurchargePct: true,
      peakSurchargePct: true,
      nonRefundableSpecialEnabled: true,
      freeCancellationDays: true,
      extraGuestFeeKrw: true,
      businessRegistrationDocUrl: true,
      lodgingReportDocUrl: true,
      amenities: true,
      lat: true,
      lng: true,
      location: true,
      images: {
        orderBy: { sortOrder: "asc" },
        select: { id: true, url: true, sortOrder: true },
      },
    },
  });
}
