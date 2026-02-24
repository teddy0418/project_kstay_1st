import { prisma } from "@/lib/db";
import { getServerSessionUser } from "@/lib/auth/server";
import { findPastStaysByGuestUserId } from "@/lib/repositories/bookings";
import type { Listing } from "@/types";

export type TripItem = {
  booking: { id: string; checkIn: string; checkOut: string; nights: number; reviewed?: boolean };
  listing: Listing;
};

function toListingForTrip(row: {
  id: string;
  title: string;
  city: string;
  area: string;
  address: string;
  location: string | null;
  basePriceKrw: number;
  rating: number;
  reviewCount: number;
  hostBio: string | null;
  hostBioKo: string | null;
  hostBioJa: string | null;
  hostBioZh: string | null;
  checkInTime: string | null;
  amenities: string[];
  images: Array<{ url: string; sortOrder: number }>;
}): Listing {
  const images = (row.images ?? []).slice().sort((a, b) => a.sortOrder - b.sortOrder).map((x) => x.url);
  return {
    id: row.id,
    title: row.title,
    location: row.location ?? `${row.city} · ${row.area}`,
    address: row.address,
    images,
    pricePerNightKRW: row.basePriceKrw,
    rating: row.rating ?? 0,
    categories: ["homes"],
    lat: 37.5665,
    lng: 126.978,
    hostName: "KSTAY Host",
    hostBio: row.hostBio ?? "Welcome to KSTAY.",
    hostBioI18n: {
      ko: row.hostBioKo ?? undefined,
      ja: row.hostBioJa ?? undefined,
      zh: row.hostBioZh ?? undefined,
    },
    hostProfileImageUrl:
      "https://images.unsplash.com/photo-1502685104226-ee32379fefbe?auto=format&fit=crop&w=800&q=80",
    checkInTime: row.checkInTime ?? "15:00",
    amenities: Array.isArray(row.amenities) ? row.amenities : [],
  };
}

/** 서버 전용: 현재 세션 유저의 과거 숙소 목록. 로그인 안 됐으면 null */
export async function getPastTripsForCurrentUser(): Promise<TripItem[] | null> {
  const user = await getServerSessionUser();
  if (!user) return null;

  let guestUserId = user.id;
  if (user.email) {
    const dbUser = await prisma.user.findUnique({
      where: { email: user.email.trim().toLowerCase() },
      select: { id: true },
    });
    if (dbUser) guestUserId = dbUser.id;
  }

  const rows = await findPastStaysByGuestUserId(guestUserId);
  const bookingIds = rows.map((b) => b.id);
  const reviewBookingIds =
    bookingIds.length === 0
      ? new Set<string>()
      : new Set(
          (
            await prisma.review.findMany({
              where: { bookingId: { in: bookingIds } },
              select: { bookingId: true },
            })
          ).map((r) => r.bookingId)
        );

  return rows.map((b) => ({
    booking: {
      id: b.id,
      checkIn: b.checkIn.toISOString().slice(0, 10),
      checkOut: b.checkOut.toISOString().slice(0, 10),
      nights: b.nights,
      reviewed: reviewBookingIds.has(b.id),
    },
    listing: toListingForTrip(b.listing as Parameters<typeof toListingForTrip>[0]),
  }));
}
