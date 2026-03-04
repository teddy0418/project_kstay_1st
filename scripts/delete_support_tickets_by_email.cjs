// Delete ALL support tickets (and related notifications) for users whose email contains a given keyword.

// Load environment variables
try {
  require("dotenv").config();
  require("dotenv").config({ path: ".env.local" });
} catch (e) {
  // ignore
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

const KEYWORD = process.env.KSTAY_DELETE_SUPPORT_EMAIL_KEYWORD || "teddy123";

async function main() {
  console.log(`Deleting support tickets for users with email/name containing '${KEYWORD}'...`);

  const users = await prisma.user.findMany({
    where: {
      OR: [
        {
          email: {
            contains: KEYWORD,
            mode: "insensitive",
          },
        },
        {
          name: {
            contains: KEYWORD,
            mode: "insensitive",
          },
        },
        {
          displayName: {
            contains: KEYWORD,
            mode: "insensitive",
          },
        },
      ],
    },
    select: { id: true, email: true, name: true, displayName: true },
  });

  if (users.length === 0) {
    console.log("No users matched.");
    return;
  }

  console.log(
    `Matched ${users.length} user(s):`,
    users.map((u) => u.email || u.displayName || u.name || u.id)
  );

  const userIds = users.map((u) => u.id);

  const tickets = await prisma.supportTicket.findMany({
    where: { userId: { in: userIds } },
    select: { id: true, userId: true, subject: true, createdAt: true },
  });

  if (tickets.length === 0) {
    console.log("No support tickets found for these users.");
    return;
  }

  console.log(`Will delete ${tickets.length} support tickets.`);

  const ticketIds = tickets.map((t) => t.id);

  const notifResult = await prisma.notification.deleteMany({
    where: { supportTicketId: { in: ticketIds } },
  });
  console.log(`Deleted ${notifResult.count} notifications linked to these tickets.`);

  const ticketResult = await prisma.supportTicket.deleteMany({
    where: { id: { in: ticketIds } },
  });
  console.log(`Deleted ${ticketResult.count} support tickets.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

