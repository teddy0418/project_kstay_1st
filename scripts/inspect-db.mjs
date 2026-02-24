/**
 * DB 메타데이터 점검 (마이그레이션 테이블, Listing 컬럼).
 * 앱과 동일한 URL 우선순위: POSTGRES_PRISMA_URL || DATABASE_URL
 * 실행: node --env-file=.env.local scripts/inspect-db.mjs
 */
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const connectionString = process.env.POSTGRES_PRISMA_URL || process.env.DATABASE_URL;
const urlSource = process.env.POSTGRES_PRISMA_URL ? "POSTGRES_PRISMA_URL" : "DATABASE_URL";

if (!connectionString) {
  console.error("[inspect-db] Missing POSTGRES_PRISMA_URL and DATABASE_URL.");
  process.exit(1);
}

function maskUrl(u) {
  try {
    const match = u.match(/@([^/]+)(\/[^?]*)?/);
    const host = match ? match[1].split(":")[0] : "(unknown)";
    const db = match && match[2] ? match[2].replace(/^\//, "") || "(default)" : "(default)";
    return { host, db, schema: "public", provider: "postgresql" };
  } catch {
    return { host: "(parse error)", db: "(parse error)", schema: "public", provider: "postgresql" };
  }
}

const masked = maskUrl(connectionString);
console.log("[inspect-db] URL source:", urlSource);
console.log("[inspect-db] DB host:", masked.host, "| dbname:", masked.db, "| schema:", masked.schema);

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function run() {
  let hasMigrations = null;
  let columns = [];

  try {
    const r = await prisma.$queryRawUnsafe(
      "SELECT to_regclass('public._prisma_migrations') IS NOT NULL AS has_migrations_table"
    );
    hasMigrations = r?.[0]?.has_migrations_table ?? null;
  } catch (e) {
    console.error("[inspect-db] _prisma_migrations check failed:", e.message);
  }

  try {
    const c = await prisma.$queryRawUnsafe(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'Listing'
      ORDER BY column_name
    `);
    columns = (c || []).map((row) => row.column_name);
  } catch (e) {
    console.error("[inspect-db] Listing columns query failed:", e.message);
  }

  console.log("[inspect-db] has_migrations_table:", hasMigrations);
  console.log("[inspect-db] Listing columns:", columns.length, "total");
  const required = [
    "title",
    "titleKo",
    "titleJa",
    "titleZh",
    "hostBioKo",
    "hostBioJa",
    "hostBioZh",
    "checkInTime",
    "checkOutTime",
    "city",
    "area",
    "address",
    "basePriceKrw",
  ];
  for (const col of required) {
    const exists = columns.includes(col);
    console.log("  -", col + ":", exists ? "YES" : "MISSING");
  }

  await prisma.$disconnect();
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
