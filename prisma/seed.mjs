import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const connectionString =
  process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/kstay?schema=public";
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
          url: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1600&q=80",
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

  console.log("Seed complete", { admin: admin.id, host: host.id, listing: listing.id });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
