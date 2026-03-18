import { prisma } from "@/lib/db";
import type { Listing } from "@/types";

type DbListing = {
  id: string;
  title: string;
  city: string;
  area: string;
  address: string;
  location: string | null;
  lat: number | null;
  lng: number | null;
  basePriceKrw: number;
  rating: number;
  reviewCount: number;
  hostBio: string | null;
  hostBioEn: string | null;
  hostBioKo: string | null;
  hostBioJa: string | null;
  hostBioZh: string | null;
  checkInTime: string;
  checkInGuideMessage?: string | null;
  houseRulesMessage?: string | null;
  amenities: string[];
  images: Array<{ url: string; sortOrder: number }>;
  host?: { name: string | null; image: string | null; displayName: string | null; profilePhotoUrl: string | null } | null;
  nonRefundableSpecialEnabled?: boolean;
  propertyType?: string | null;
};

const DEFAULT_HOST_AVATAR =
  "https://images.unsplash.com/photo-1502685104226-ee32379fefbe?auto=format&fit=crop&w=800&q=80";

function toListing(row: DbListing): Listing {
  // 글로벌 표준: 게스트 프로필(displayName, profilePhotoUrl)과 동일한 정보를 숙소 상세에 표시
  const hostName =
    (row.host?.displayName?.trim() || row.host?.name?.trim()) || "KSTAY Host";
  const hostProfileImageUrl =
    (row.host?.profilePhotoUrl?.trim() || row.host?.image?.trim()) || DEFAULT_HOST_AVATAR;
  return {
    id: row.id,
    title: row.title,
    location: row.location ?? `${row.city} · ${row.area}`,
    address: row.address,
    images: row.images.sort((a, b) => a.sortOrder - b.sortOrder).map((x) => x.url),
    pricePerNightKRW: row.basePriceKrw,
    rating: row.rating,
    reviewCount: row.reviewCount ?? 0,
    categories: ["homes"],
    lat: row.lat ?? 37.5665,
    lng: row.lng ?? 126.978,
    hostName,
    hostBio: row.hostBio ?? "Welcome to KSTAY.",
    hostBioI18n: {
      en: row.hostBioEn ?? undefined,
      ko: row.hostBioKo ?? undefined,
      ja: row.hostBioJa ?? undefined,
      zh: row.hostBioZh ?? undefined,
    },
    hostProfileImageUrl,
    checkInTime: row.checkInTime || "15:00",
    checkInGuideMessage: row.checkInGuideMessage ?? undefined,
    houseRulesMessage: row.houseRulesMessage ?? undefined,
    amenities: Array.isArray(row.amenities) ? row.amenities : [],
    nonRefundableSpecialEnabled: row.nonRefundableSpecialEnabled ?? false,
    propertyType: row.propertyType ?? undefined,
  };
}

export type ListingsFilter = {
  where?: string;
  start?: string; // YYYY-MM-DD
  end?: string;   // YYYY-MM-DD
};

/** 게스트 노출용으로 필요한 필드만 선택 (DB에 없는 컬럼 참조 방지) */
const publicListingSelect = {
  id: true,
  title: true,
  city: true,
  area: true,
  address: true,
  location: true,
  lat: true,
  lng: true,
  basePriceKrw: true,
  rating: true,
  reviewCount: true,
  hostBio: true,
  hostBioEn: true,
  hostBioKo: true,
  hostBioJa: true,
  hostBioZh: true,
  checkInTime: true,
  checkInGuideMessage: true,
  houseRulesMessage: true,
  amenities: true,
  nonRefundableSpecialEnabled: true,
  propertyType: true,
  images: { select: { url: true, sortOrder: true } },
  host: { select: { name: true, image: true, displayName: true, profilePhotoUrl: true } },
} as const;

/** 섹션(홈 추천/한옥) 쿼리용. hostBioEn 제외 (상세/검색은 publicListingSelect 사용) */
const publicListingSelectForSection = {
  id: true,
  title: true,
  city: true,
  area: true,
  address: true,
  location: true,
  lat: true,
  lng: true,
  basePriceKrw: true,
  rating: true,
  reviewCount: true,
  hostBio: true,
  hostBioKo: true,
  hostBioJa: true,
  hostBioZh: true,
  checkInTime: true,
  checkInGuideMessage: true,
  houseRulesMessage: true,
  amenities: true,
  nonRefundableSpecialEnabled: true,
  propertyType: true,
  images: { select: { url: true, sortOrder: true } },
  host: { select: { name: true, image: true, displayName: true, profilePhotoUrl: true } },
} as const;

export async function getPublicListings(filters?: ListingsFilter): Promise<Listing[]> {
  try {
    const q = filters?.where?.trim();
    const startDate = filters?.start && filters?.end ? new Date(`${filters.start}T00:00:00.000Z`) : null;
    const endDate = filters?.start && filters?.end ? new Date(`${filters.end}T00:00:00.000Z`) : null;

    const rows = await prisma.listing.findMany({
      where: {
        status: "APPROVED",
        ...(q && {
          AND: [
            {
              OR: [
                { city: { contains: q, mode: "insensitive" } },
                { area: { contains: q, mode: "insensitive" } },
                { title: { contains: q, mode: "insensitive" } },
                { address: { contains: q, mode: "insensitive" } },
              ],
            },
          ],
        }),
        ...(startDate && endDate && {
          bookings: {
            none: {
              status: "CONFIRMED",
              checkIn: { lt: endDate },
              checkOut: { gt: startDate },
            },
          },
        }),
      },
      select: publicListingSelect,
      orderBy: { createdAt: "desc" },
    });
    return rows.map((r) => toListing(r as DbListing));
  } catch (e) {
    // DB 오류 시 mock 노출 방지. 에러는 로그로 남겨 원인 파악 가능하게 함.
    console.error("[getPublicListings]", e);
    return [];
  }
}

export async function getPublicListingById(id: string): Promise<Listing | null> {
  try {
    const row = await prisma.listing.findFirst({
      where: { id, status: "APPROVED" },
      select: publicListingSelect,
    });
    if (row) return toListing(row as DbListing);
  } catch (e) {
    console.error("[getPublicListingById]", e);
  }
  return null;
}

/** DB만 사용. 승인된 숙소만 반환 (mock 미사용). 관리자 테스트 리뷰 등용. */
export async function getApprovedListingsFromDb(): Promise<Listing[]> {
  try {
    const rows = await prisma.listing.findMany({
      where: { status: "APPROVED" },
      select: publicListingSelect,
      orderBy: { createdAt: "desc" },
    });
    return rows.map((r) => toListing(r as DbListing));
  } catch {
    return [];
  }
}

/** DB만 사용. ids 순서대로 반환 (없는 id는 제외). */
export async function getPublicListingsByIds(ids: string[]): Promise<Listing[]> {
  if (ids.length === 0) return [];
  const unique = [...new Set(ids)].filter(Boolean);
  try {
    const rows = await prisma.listing.findMany({
      where: { id: { in: unique }, status: "APPROVED" },
      select: publicListingSelect,
    });
    const byId = new Map(rows.map((r) => [r.id, toListing(r as DbListing)]));
    return unique.map((id) => byId.get(id)).filter(Boolean) as Listing[];
  } catch {
    return [];
  }
}

/** KSTAY Black: 관리자가 선정한 프리미엄 숙소만 (kstayBlackSortOrder 오름차순) */
export async function getKstayBlackListings(): Promise<Listing[]> {
  try {
    const rows = await prisma.listing.findMany({
      where: { status: "APPROVED", kstayBlackSortOrder: { not: null } },
      select: publicListingSelect,
      orderBy: { kstayBlackSortOrder: "asc" },
    });
    return rows.map((r) => toListing(r as DbListing));
  } catch (e) {
    console.error("[getKstayBlackListings]", e);
    return [];
  }
}

const SECTION_PAGE_SIZE = 8;

/** 인기숙소(추천) 섹션에서 제외할 listing id (KSTAY Black 전부 + Seocho Business Stay) */
const RECOMMENDED_EXCLUDE_IDS = [
  "seed-black-1",
  "seed-black-2",
  "seed-black-3",
  "seed-black-4",
  "seed-black-5",
  "seed-black-6",
  "seed-black-7",
  "seed-black-8",
  "seed-black-9",
  "seed-black-10",
  "seed-rec-10", // Seocho Business Stay
];

export type SectionType = "recommended" | "hanok" | "kstay-black";

export type SectionPageResult = {
  listings: Listing[];
  nextCursor: string | null;
};

type PromotionPlacement = "HOME_RECOMMENDED" | "HOME_HANOK" | "HOME_KSTAY_BLACK";

/** 섹션별 10개씩 커서 페이지네이션 (더보기용). cursor는 JSON 문자열 (이전 응답의 nextCursor) */
export async function getPublicListingsBySection(
  section: SectionType,
  cursor: string | null,
  limit: number = SECTION_PAGE_SIZE
): Promise<SectionPageResult> {
  try {
    if (section === "kstay-black") {
      let cursorObj: { id: string } | null = null;
      if (cursor) {
        try { cursorObj = JSON.parse(cursor) as { id: string }; } catch { cursorObj = null; }
      }
      const rows = await prisma.listing.findMany({
        where: { status: "APPROVED", kstayBlackSortOrder: { not: null } },
        select: publicListingSelectForSection,
        orderBy: { kstayBlackSortOrder: "asc" },
        ...(cursorObj?.id ? { cursor: { id: cursorObj.id }, skip: 1 } : {}),
        take: limit + 1,
      });
      const hasNext = rows.length > limit;
      const list = rows.slice(0, limit).map((r) => toListing(r as unknown as DbListing));
      const lastRow = hasNext && rows.length > 0 ? rows[limit - 1] : null;
      const nextCursor = lastRow ? JSON.stringify({ id: lastRow.id }) : null;
      return { listings: list, nextCursor };
    }

    const isHanok = section === "hanok";
    const baseWhere = isHanok
      ? { status: "APPROVED" as const, propertyType: "hanok" as const }
      : {
          status: "APPROVED" as const,
          OR: [{ propertyType: null }, { propertyType: { not: "hanok" } }],
          id: { notIn: RECOMMENDED_EXCLUDE_IDS },
        };

    const orderBy = [{ createdAt: "desc" as const }, { id: "desc" as const }];
    const selectWithCreatedAt = { ...publicListingSelectForSection, createdAt: true };
    let cursorObj: { createdAt: string; id: string } | null = null;
    if (cursor) {
      try { cursorObj = JSON.parse(cursor) as { createdAt: string; id: string }; } catch { cursorObj = null; }
    }

    const rows = await prisma.listing.findMany({
      where: baseWhere,
      select: selectWithCreatedAt,
      orderBy,
      ...(cursorObj?.createdAt && cursorObj?.id
        ? { cursor: { createdAt: new Date(cursorObj.createdAt), id: cursorObj.id }, skip: 1 }
        : {}),
      take: limit + 1,
    });

    // 광고·상위 노출: 섹션별 placement에 따라 현재 활성 프로모션이 있는 숙소를 위로 올린다.
    const limitedRows = rows.slice(0, limit);
    const placement: PromotionPlacement | null =
      section === "recommended" ? "HOME_RECOMMENDED" : section === "hanok" ? "HOME_HANOK" : null;

    let sortedRows = limitedRows;
    // 신규 ListingPromotion 모델이 아직 Prisma Client에 반영되지 않은 환경(개발 서버 캐시 등)에서도
    // 전체 섹션이 터지지 않도록 방어적으로 확인한다.
    const hasListingPromotion =
      (prisma as unknown as { listingPromotion?: { findMany?: unknown } }).listingPromotion?.findMany != null;

    if (placement && limitedRows.length > 0 && hasListingPromotion) {
      const listingIds = limitedRows.map((r) => r.id);
      const now = new Date();
      const promos = await prisma.listingPromotion.findMany({
        where: {
          listingId: { in: listingIds },
          placement,
          status: "ACTIVE",
          startAt: { lte: now },
          endAt: { gt: now },
        },
        select: { listingId: true, priority: true },
      });
      if (promos.length > 0) {
        const priorityMap = new Map<string, number>();
        for (const p of promos) {
          const prev = priorityMap.get(p.listingId) ?? 0;
          priorityMap.set(p.listingId, Math.max(prev, p.priority ?? 0));
        }
        const indexMap = new Map<string, number>();
        limitedRows.forEach((r, idx) => indexMap.set(r.id, idx));

        sortedRows = [...limitedRows].sort((a, b) => {
          const pa = priorityMap.get(a.id);
          const pb = priorityMap.get(b.id);
          if (pa != null && pb != null) {
            if (pb !== pa) return pb - pa;
            return (indexMap.get(a.id) ?? 0) - (indexMap.get(b.id) ?? 0);
          }
          if (pa != null && pb == null) return -1;
          if (pa == null && pb != null) return 1;
          return (indexMap.get(a.id) ?? 0) - (indexMap.get(b.id) ?? 0);
        });
      }
    }

    const list = sortedRows.map((r) => toListing(r as unknown as DbListing));
    const hasNext = rows.length > limit;
    const lastRow = hasNext && limitedRows.length > 0 ? limitedRows[limitedRows.length - 1] : null;
    const nextCursor =
      lastRow && "createdAt" in lastRow && lastRow.createdAt
        ? JSON.stringify({ createdAt: (lastRow.createdAt as Date).toISOString(), id: lastRow.id })
        : null;
    return { listings: list, nextCursor };
  } catch (e) {
    console.error("[getPublicListingsBySection]", e);
    return { listings: [], nextCursor: null };
  }
}
