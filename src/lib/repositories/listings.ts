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
  images: Array<{ url: string; sortOrder: number }>;
};

function toListing(row: DbListing): Listing {
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
    hostName: "KSTAY Host",
    hostBio: row.hostBio ?? "Welcome to KSTAY.",
    hostBioI18n: {
      ko: row.hostBioKo ?? undefined,
      ja: row.hostBioJa ?? undefined,
      zh: row.hostBioZh ?? undefined,
    },
    hostProfileImageUrl:
      "https://images.unsplash.com/photo-1502685104226-ee32379fefbe?auto=format&fit=crop&w=800&q=80",
    checkInTime: row.checkInTime || "15:00",
  };
}

export async function getPublicListings(): Promise<Listing[]> {
  try {
    const rows = await prisma.listing.findMany({
      where: { status: "APPROVED" },
      include: { images: true },
      orderBy: { createdAt: "desc" },
    });
    if (rows.length > 0) {
      return rows.map((r) => toListing(r as DbListing));
    }
  } catch {
    // fall through to mock data
  }
  return mockListings;
}

export async function getPublicListingById(id: string): Promise<Listing | null> {
  try {
    const row = await prisma.listing.findFirst({
      where: { id, status: "APPROVED" },
      include: { images: true },
    });
    if (row) return toListing(row as DbListing);
  } catch {
    // fall through to mock data
  }
  return mockListings.find((x) => x.id === id) ?? null;
}
