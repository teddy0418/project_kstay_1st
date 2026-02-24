import { prisma } from "@/lib/db";
import { getOrCreateServerUser } from "@/lib/auth/server";

export type HostFlowStatus = "NONE" | "DRAFT" | "PENDING" | "APPROVED";

export async function getHostFlowStatus(userId: string): Promise<HostFlowStatus> {
  const rows = await prisma.listing.findMany({
    where: { hostId: userId },
    select: { status: true },
    take: 50,
    orderBy: { createdAt: "desc" },
  });

  if (rows.length === 0) return "NONE";
  if (rows.some((r) => r.status === "APPROVED")) return "APPROVED";
  if (rows.some((r) => r.status === "PENDING")) return "PENDING";
  if (rows.some((r) => r.status === "DRAFT")) return "DRAFT";
  return "NONE";
}

export async function getCurrentHostFlow() {
  const user = await getOrCreateServerUser();
  if (!user) return null;
  const status = await getHostFlowStatus(user.id);
  return { user, status };
}
