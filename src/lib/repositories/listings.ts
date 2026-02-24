import { prisma } from "@/lib/db";
import { listings as mockListings } from "@/lib/mockData";
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
  hostBioKo: string | null;
  hostBioJa: string | null;
  hostBioZh: string | null;
  checkInTime: string;
  checkInGuideMessage?: string | null;
  houseRulesMessage?: string | null;
  amenities: string[];
  images: Array<{ url: string; sortOrder: number }>;
  host?: { name: string | null; image: string | null; displayName: string | null; profilePhotoUrl: string | null } | null;
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
    categories: ["homes"],
    lat: row.lat ?? 37.5665,
    lng: row.lng ?? 126.978,
    hostName,
    hostBio: row.hostBio ?? "Welcome to KSTAY.",
    hostBioI18n: {
      ko: row.hostBioKo ?? undefined,
      ja: row.hostBioJa ?? undefined,
      zh: row.hostBioZh ?? undefined,
    },
    hostProfileImageUrl,
    checkInTime: row.checkInTime || "15:00",
    checkInGuideMessage: row.checkInGuideMessage ?? undefined,
    houseRulesMessage: row.houseRulesMessage ?? undefined,
    amenities: Array.isArray(row.amenities) ? row.amenities : [],
  };
}

export type ListingsFilter = {
  where?: string;
  start?: string; // YYYY-MM-DD
  end?: string;   // YYYY-MM-DD
};

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
      include: { images: true, host: { select: { name: true, image: true, displayName: true, profilePhotoUrl: true } } },
      orderBy: { createdAt: "desc" },
    });
    if (rows.length > 0) {
      return rows.map((r) => toListing(r as DbListing));
    }
  } catch {
    // fall through to mock data when DB unavailable (e.g. dev)
  }
  return mockListings;
}

export async function getPublicListingById(id: string): Promise<Listing | null> {
  try {
    const row = await prisma.listing.findFirst({
      where: { id, status: "APPROVED" },
      include: { images: true, host: { select: { name: true, image: true, displayName: true, profilePhotoUrl: true } } },
    });
    if (row) return toListing(row as DbListing);
  } catch {
    // fall through to mock data
  }
  return mockListings.find((x) => x.id === id) ?? null;
}

/** DB만 사용. 승인된 숙소만 반환 (mock 미사용). 관리자 테스트 리뷰 등용. */
export async function getApprovedListingsFromDb(): Promise<Listing[]> {
  try {
    const rows = await prisma.listing.findMany({
      where: { status: "APPROVED" },
      include: { images: true, host: { select: { name: true, image: true, displayName: true, profilePhotoUrl: true } } },
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
      include: { images: true, host: { select: { name: true, image: true, displayName: true, profilePhotoUrl: true } } },
    });
    const byId = new Map(rows.map((r) => [r.id, toListing(r as DbListing)]));
    return unique.map((id) => byId.get(id)).filter(Boolean) as Listing[];
  } catch {
    return [];
  }
}
