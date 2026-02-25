#!/usr/bin/env node
/**
 * 24시간 지난 PENDING_PAYMENT 예약을 CANCELLED로 변경 (삭제하지 않음).
 * 주기적으로 실행하여 미결제 예약이 DB에 무한히 쌓이지 않도록 함.
 *
 * 사용: node --env-file=.env.local scripts/expire-pending-bookings.mjs
 * 크론 예: 0 3 * * * (매일 새벽 3시)
 */
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const PENDING_EXPIRE_HOURS = 24;

const connectionString =
  process.env.POSTGRES_PRISMA_URL || process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;
if (!connectionString) {
  console.error("DATABASE_URL required.");
  process.exit(1);
}
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

function getExpireBeforeDate() {
  const d = new Date();
  d.setHours(d.getHours() - PENDING_EXPIRE_HOURS);
  return d;
}

async function main() {
  const expireBefore = getExpireBeforeDate();
  const result = await prisma.booking.updateMany({
    where: {
      status: "PENDING_PAYMENT",
      createdAt: { lt: expireBefore },
    },
    data: { status: "CANCELLED" },
  });
  console.log(
    `Expired ${result.count} PENDING_PAYMENT booking(s) (created before ${expireBefore.toISOString()})`
  );
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
