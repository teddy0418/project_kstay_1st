import { prisma } from "@/lib/db";

async function main() {
  const tickets = await prisma.supportTicket.findMany({
    orderBy: { createdAt: "desc" },
    select: { id: true, userId: true, createdAt: true },
  });

  if (tickets.length === 0) {
    console.log("No support tickets found. Nothing to delete.");
    return;
  }

  const toKeep = new Set<string>();
  const toDelete: string[] = [];

  for (const t of tickets) {
    if (!toKeep.has(t.userId)) {
      // 가장 최근 1개는 유지
      toKeep.add(t.userId);
    } else {
      toDelete.push(t.id);
    }
  }

  if (toDelete.length === 0) {
    console.log("Each user has at most one ticket. Nothing to delete.");
    return;
  }

  console.log(`Will delete ${toDelete.length} old support tickets.`);

  // 해당 티켓과 연결된 알림 먼저 정리
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

