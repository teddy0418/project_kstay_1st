import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const connectionString =
  process.env.POSTGRES_PRISMA_URL || process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is required for seeding.");
}
if (connectionString.startsWith("file:")) {
  throw new Error("DATABASE_URL must be PostgreSQL (postgresql://...), not SQLite file URL.");
}
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function main() {
  const admin = await prisma.user.upsert({
    where: { id: "demo-admin" },
    update: { role: "ADMIN", name: "Admin" },
    create: {
      id: "demo-admin",
      role: "ADMIN",
      name: "Admin",
      email: "admin@kstay.dev",
    },
  });

  const host = await prisma.user.upsert({
    where: { id: "demo-host" },
    update: { role: "HOST", name: "Host" },
    create: {
      id: "demo-host",
      role: "HOST",
      name: "Host",
      email: "host@kstay.dev",
    },
  });

  await prisma.hostProfile.upsert({
    where: { userId: host.id },
    update: { displayName: "Demo Host" },
    create: { userId: host.id, displayName: "Demo Host" },
  });

  const listing = await prisma.listing.upsert({
    where: { id: "seed-seoul-jongno" },
    update: {
      title: "Demo Seoul Stay",
      city: "Seoul",
      area: "Jongno",
      address: "Jongno-gu, Seoul, Korea",
      location: "Seoul · Jongno",
      basePriceKrw: 120000,
      status: "APPROVED",
      approvedAt: new Date(),
    },
    create: {
      id: "seed-seoul-jongno",
      hostId: host.id,
      title: "Demo Seoul Stay",
      city: "Seoul",
      area: "Jongno",
      address: "Jongno-gu, Seoul, Korea",
      location: "Seoul · Jongno",
      basePriceKrw: 120000,
      status: "APPROVED",
      approvedAt: new Date(),
    },
  });

  const existing = await prisma.listingImage.count({ where: { listingId: listing.id } });
  if (existing === 0) {
    await prisma.listingImage.createMany({
      data: [
        {
          listingId: listing.id,
          url: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=1600&q=80",
          sortOrder: 0,
        },
        {
          listingId: listing.id,
          url: "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1600&q=80",
          sortOrder: 1,
        },
      ],
    });
  }

  // 결제 테스트용 예시 숙소 (결제창까지 확인용)
  const paymentTestListing = await prisma.listing.upsert({
    where: { id: "payment-test-listing" },
    update: {
      title: "결제 테스트용 예시 숙소",
      titleKo: "결제 테스트용 예시 숙소",
      city: "Seoul",
      area: "Gangnam",
      address: "Gangnam-gu, Seoul, Korea",
      location: "Seoul · Gangnam",
      basePriceKrw: 50000,
      status: "APPROVED",
      approvedAt: new Date(),
    },
    create: {
      id: "payment-test-listing",
      hostId: host.id,
      title: "결제 테스트용 예시 숙소",
      titleKo: "결제 테스트용 예시 숙소",
      city: "Seoul",
      area: "Gangnam",
      address: "Gangnam-gu, Seoul, Korea",
      location: "Seoul · Gangnam",
      basePriceKrw: 50000,
      status: "APPROVED",
      approvedAt: new Date(),
    },
  });

  const paymentTestImages = await prisma.listingImage.count({ where: { listingId: paymentTestListing.id } });
  if (paymentTestImages === 0) {
    await prisma.listingImage.createMany({
      data: [
        { listingId: paymentTestListing.id, url: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1600&q=80", sortOrder: 0 },
        { listingId: paymentTestListing.id, url: "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=1600&q=80", sortOrder: 1 },
      ],
    });
  }

  // Admin 계정(official.kstay@gmail.com) 체크인 완료 예시 예약 (프로필 Your trips / 리뷰 쓰기 확인용)
  const adminForTrip = await prisma.user.findFirst({
    where: { email: "official.kstay@gmail.com" },
  });
  const guestUser = adminForTrip ?? admin;

  const pastCheckOut = new Date();
  pastCheckOut.setDate(pastCheckOut.getDate() - 3);
  pastCheckOut.setHours(0, 0, 0, 0);
  const pastCheckIn = new Date(pastCheckOut);
  pastCheckIn.setDate(pastCheckIn.getDate() - 2);
  const cancelDeadline = new Date(pastCheckIn);
  cancelDeadline.setDate(cancelDeadline.getDate() - 7);

  const existingAdminBooking = await prisma.booking.findFirst({
    where: { guestUserId: guestUser.id, status: "CONFIRMED", listingId: listing.id },
  });
  if (!existingAdminBooking) {
    const adminBooking = await prisma.booking.create({
      data: {
        publicToken: `seed-admin-past-${Date.now()}`,
        listingId: listing.id,
        guestUserId: guestUser.id,
        guestEmail: guestUser.email ?? "official.kstay@gmail.com",
        guestName: guestUser.name ?? "Admin",
        checkIn: pastCheckIn,
        checkOut: pastCheckOut,
        nights: 2,
        totalUsd: 20,
        totalKrw: 240000,
        status: "CONFIRMED",
        confirmedAt: new Date(),
        cancellationDeadlineKst: cancelDeadline,
      },
    });
    console.log("Admin 예시 예약 생성 (체크아웃 완료)", { bookingId: adminBooking.id, guestEmail: guestUser.email });
  }

  console.log("Seed complete", {
    admin: admin.id,
    host: host.id,
    listing: listing.id,
    paymentTestListing: paymentTestListing.id,
    paymentTestUrl: `/listings/${paymentTestListing.id}?start=2026-03-01&end=2026-03-03&guests=1`,
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
