#!/usr/bin/env node
/**
 * 테스트용: payment-test-listing의 오래된 PENDING_PAYMENT 예약 정리
 * 결제 테스트 시 409 Conflict 방지
 *
 * 사용: node --env-file=.env.local scripts/clear-pending-bookings.mjs
 */
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const connectionString =
  process.env.POSTGRES_PRISMA_URL || process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;
if (!connectionString) {
  console.error("DATABASE_URL required.");
  process.exit(1);
}
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function main() {
  const deleted = await prisma.booking.deleteMany({
    where: {
      listingId: "payment-test-listing",
      status: "PENDING_PAYMENT",
    },
  });
  console.log(`Deleted ${deleted.count} PENDING_PAYMENT booking(s) for payment-test-listing`);
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
