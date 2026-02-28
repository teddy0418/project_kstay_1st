import { getOrCreateServerUser } from "@/lib/auth/server";
import { unblockDate } from "@/lib/repositories/host-calendar";
import { prisma } from "@/lib/db";
import { apiError, apiOk } from "@/lib/api/response";

/** POST { date: "YYYY-MM-DD" } — 해당 날짜를 호스트의 모든 승인 숙소에서 판매 열기(차단 해제)합니다. */
export async function POST(req: Request) {
  const user = await getOrCreateServerUser();
  if (!user) return apiError(401, "UNAUTHORIZED", "Not logged in");
  if (user.role !== "HOST" && user.role !== "ADMIN") {
    return apiError(403, "FORBIDDEN", "Host role required");
  }

  const body = await req.json().catch(() => ({}));
  const dateStr = body.date;
  if (!dateStr || typeof dateStr !== "string") {
    return apiError(400, "BAD_REQUEST", "date (YYYY-MM-DD) required");
  }
  const date = new Date(dateStr + "T00:00:00Z");
  if (isNaN(date.getTime())) return apiError(400, "BAD_REQUEST", "Invalid date");

  const listings = await prisma.listing.findMany({
    where: { hostId: user.id, status: "APPROVED" },
    select: { id: true },
  });

  for (const listing of listings) {
    try {
      await unblockDate(listing.id, user.id, date);
    } catch {
      // skip if single listing fails
    }
  }

  return apiOk({ ok: true, unblockedCount: listings.length });
}
