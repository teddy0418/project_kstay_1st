/**
 * Host listing flow verification (B안).
 * Prisma + DB 연동 검증. 인증 없이 repository 수준 연산만 수행.
 * 실행: node --env-file=.env.local scripts/verify-host-listings.mjs
 */
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

// 앱(src/lib/db.ts)과 동일한 URL 우선순위로 동일 DB 사용
const connectionString = process.env.POSTGRES_PRISMA_URL || process.env.DATABASE_URL;

if (!connectionString) {
  console.error("[verify-host-listings] Missing POSTGRES_PRISMA_URL and DATABASE_URL.");
  process.exit(1);
}
const urlSource = process.env.POSTGRES_PRISMA_URL ? "POSTGRES_PRISMA_URL" : "DATABASE_URL";
function maskUrl(u) {
  try {
    const match = u.match(/@([^/]+)(\/[^?]*)?/);
    const host = match ? match[1].split(":")[0] : "(unknown)";
    const db = match && match[2] ? match[2].replace(/^\//, "") : "(default)";
    return { host, db };
  } catch {
    return { host: "(parse error)", db: "(parse error)" };
  }
}
if (connectionString.startsWith("file:")) {
  console.error("[verify-host-listings] PostgreSQL only.");
  process.exit(1);
}

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

const results = { create: null, update: null, imageAdd: null, imageDelete: null, reorder: null, pending: null, getForEdit: null, list: null };

async function run() {
  const masked = maskUrl(connectionString);
  console.log("[verify-host-listings] DB URL source:", urlSource, "| host:", masked.host, "| db:", masked.db);
  console.log("[verify-host-listings] Starting…");

  let userId = null;
  const existing = await prisma.user.findFirst({ where: { role: "HOST" }, select: { id: true } });
  if (existing) {
    userId = existing.id;
    console.log("[verify-host-listings] Using existing HOST user:", userId);
  } else {
    const anyUser = await prisma.user.findFirst({ select: { id: true } });
    if (!anyUser) {
      console.error("[verify-host-listings] No user in DB. Run db:seed first.");
      process.exit(1);
    }
    await prisma.user.update({ where: { id: anyUser.id }, data: { role: "HOST" } });
    userId = anyUser.id;
    console.log("[verify-host-listings] Set first user as HOST:", userId);
  }

  await prisma.hostProfile.upsert({
    where: { userId },
    create: { userId, displayName: "Verify Host" },
    update: { displayName: "Verify Host" },
  });

  const created = await prisma.listing.create({
    data: {
      hostId: userId,
      title: "Verify Listing",
      titleKo: "검증용",
      city: "Seoul",
      area: "Jongno",
      address: "Verify Address",
      location: "Seoul · Jongno",
      basePriceKrw: 100000,
      status: "DRAFT",
      checkInTime: "15:00",
      checkOutTime: "11:00",
      hostBio: null,
      images: {
        create: [
          { url: "https://example.com/1.jpg", sortOrder: 0 },
          { url: "https://example.com/2.jpg", sortOrder: 1 },
        ],
      },
    },
    select: { id: true, status: true, checkOutTime: true },
  });
  results.create = created;
  console.log("[verify-host-listings] 1) CREATE (DRAFT):", created.id, created.status, "checkOutTime:", created.checkOutTime);

  const updated = await prisma.listing.update({
    where: { id: created.id },
    data: { checkInTime: "14:00", checkOutTime: "10:00", title: "Verify Updated" },
    select: { id: true, checkInTime: true, checkOutTime: true },
  });
  results.update = updated;
  console.log("[verify-host-listings] 2) PATCH (checkIn/Out):", updated.checkInTime, updated.checkOutTime);

  const imagesBefore = await prisma.listingImage.findMany({ where: { listingId: created.id }, orderBy: { sortOrder: "asc" } });
  const added = await prisma.listingImage.create({
    data: { listingId: created.id, url: "https://example.com/3.jpg", sortOrder: 3 },
    select: { id: true, url: true, sortOrder: true },
  });
  results.imageAdd = added;
  console.log("[verify-host-listings] 3) IMAGE ADD:", added.id);

  const toDelete = imagesBefore[0];
  const del = await prisma.listingImage.deleteMany({ where: { id: toDelete.id, listingId: created.id } });
  results.imageDelete = { count: del.count };
  console.log("[verify-host-listings] 4) IMAGE DELETE:", del.count);

  const remaining = await prisma.listingImage.findMany({ where: { listingId: created.id }, orderBy: { sortOrder: "asc" } });
  const ids = remaining.map((i) => i.id).reverse();
  for (let i = 0; i < ids.length; i++) {
    await prisma.listingImage.updateMany({ where: { id: ids[i], listingId: created.id }, data: { sortOrder: i } });
  }
  const afterReorder = await prisma.listingImage.findMany({
    where: { listingId: created.id },
    select: { id: true, sortOrder: true },
    orderBy: { sortOrder: "asc" },
  });
  results.reorder = afterReorder;
  console.log("[verify-host-listings] 5) REORDER:", afterReorder.map((r) => r.sortOrder).join(","));

  const pending = await prisma.listing.update({
    where: { id: created.id },
    data: { status: "PENDING" },
    select: { id: true, status: true },
  });
  results.pending = pending;
  console.log("[verify-host-listings] 6) PENDING:", pending.status);

  const forEdit = await prisma.listing.findFirst({
    where: { id: created.id, hostId: userId },
    select: {
      id: true,
      status: true,
      title: true,
      titleKo: true,
      checkInTime: true,
      checkOutTime: true,
      images: { orderBy: { sortOrder: "asc" }, select: { id: true, url: true, sortOrder: true } },
    },
  });
  results.getForEdit = forEdit;
  console.log("[verify-host-listings] 7) GET for edit:", forEdit?.id, "images:", forEdit?.images?.length);

  const list = await prisma.listing.findMany({
    where: { hostId: userId },
    select: { id: true, title: true, status: true },
    orderBy: { createdAt: "desc" },
    take: 10,
  });
  results.list = list;
  console.log("[verify-host-listings] 8) LIST:", list.length, "items");

  await prisma.listing.delete({ where: { id: created.id } }).catch(() => {});
  console.log("[verify-host-listings] Cleaned up test listing.");

  const ok =
    results.create?.id &&
    results.update?.checkOutTime === "10:00" &&
    results.imageAdd?.id &&
    results.imageDelete?.count === 1 &&
    results.reorder?.length >= 1 &&
    results.pending?.status === "PENDING" &&
    results.getForEdit?.images?.length >= 1 &&
    Array.isArray(results.list);

  if (ok) {
    console.log("[verify-host-listings] All steps OK.");
  } else {
    console.error("[verify-host-listings] One or more steps failed.", results);
    process.exit(1);
  }
}

run()
  .catch((e) => {
    console.error("[verify-host-listings] Error:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
