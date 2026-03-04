// Cleanup old support tickets: keep latest per user, delete older ones + related notifications

// Load environment variables from .env and .env.local
try {
  require("dotenv").config();
  require("dotenv").config({ path: ".env.local" });
} catch (e) {
  // dotenv might not be installed in some environments; ignore
}

const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");

const connectionString = process.env.POSTGRES_PRISMA_URL || process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is required.");
}
if (connectionString.startsWith("file:")) {
  throw new Error("DATABASE_URL must be PostgreSQL (postgresql://...), not SQLite file URL.");
}
const adapter = new PrismaPg({ connectionString });

const prisma = new PrismaClient({
  adapter,
  log: process.env.NODE_ENV === "development" ? ["error"] : [],
});

async function main() {
  const tickets = await prisma.supportTicket.findMany({
    orderBy: { createdAt: "desc" },
    select: { id: true, userId: true, createdAt: true },
  });

  if (tickets.length === 0) {
    console.log("No support tickets found. Nothing to delete.");
    return;
  }

  const toKeep = new Set();
  const toDelete = [];

  for (const t of tickets) {
    if (!toKeep.has(t.userId)) {
      // 첫 번째(가장 최근) 티켓은 유지
      toKeep.add(t.userId);
    } else {
      toDelete.push(t.id);
    }
  }

  if (toDelete.length === 0) {
    console.log("Each user already has at most one support ticket. Nothing to delete.");
    return;
  }

  console.log(`Will delete ${toDelete.length} old support tickets...`);

  const notifResult = await prisma.notification.deleteMany({
    where: { supportTicketId: { in: toDelete } },
  });
  console.log(`Deleted ${notifResult.count} notifications linked to old tickets.`);

  const ticketResult = await prisma.supportTicket.deleteMany({
    where: { id: { in: toDelete } },
  });
  console.log(`Deleted ${ticketResult.count} old support tickets.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

