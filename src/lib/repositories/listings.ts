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
  amenities: string[];
  images: Array<{ url: string; sortOrder: number }>;
  host?: { name: string | null; image: string | null } | null;
};

function toListing(row: DbListing): Listing {
  const hostName = row.host?.name?.trim() || "KSTAY Host";
  const hostProfileImageUrl =
    row.host?.image?.trim() ||
    "https://images.unsplash.com/photo-1502685104226-ee32379fefbe?auto=format&fit=crop&w=800&q=80";
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
    amenities: Array.isArray(row.amenities) ? row.amenities : [],
  };
}

export async function getPublicListings(): Promise<Listing[]> {
  try {
    const rows = await prisma.listing.findMany({
      where: { status: "APPROVED" },
      include: { images: true, host: { select: { name: true, image: true } } },
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
      include: { images: true, host: { select: { name: true, image: true } } },
    });
    if (row) return toListing(row as DbListing);
  } catch {
    // fall through to mock data
  }
  return mockListings.find((x) => x.id === id) ?? null;
}

/** DB만 사용. ids 순서대로 반환 (없는 id는 제외). */
export async function getPublicListingsByIds(ids: string[]): Promise<Listing[]> {
  if (ids.length === 0) return [];
  const unique = [...new Set(ids)].filter(Boolean);
  try {
    const rows = await prisma.listing.findMany({
      where: { id: { in: unique }, status: "APPROVED" },
      include: { images: true, host: { select: { name: true, image: true } } },
    });
    const byId = new Map(rows.map((r) => [r.id, toListing(r as DbListing)]));
    return unique.map((id) => byId.get(id)).filter(Boolean) as Listing[];
  } catch {
    return [];
  }
}
