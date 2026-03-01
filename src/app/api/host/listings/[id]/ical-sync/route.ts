import { apiError, apiOk } from "@/lib/api/response";
import { getOrCreateServerUser } from "@/lib/auth/server";
import { prisma } from "@/lib/db";
import { blockDate } from "@/lib/repositories/host-calendar";

/** node-ical 파싱 결과의 VEVENT 항목 형태 (타입만 사용, 런타임은 node-ical에 위임) */
interface IcalEventLike {
  type?: string;
  start?: Date;
  end?: Date;
}

/** node-ical은 빌드 시 page data 수집 단계에서 BigInt 이슈를 일으킬 수 있어, 호출 시점에만 동적 로드 */
async function fetchIcalEvents(url: string): Promise<unknown> {
  const mod = await import("node-ical");
  return mod.async.fromURL(url, {});
}

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const user = await getOrCreateServerUser();
    if (!user) return apiError(401, "UNAUTHORIZED", "Login required");
    if (user.role !== "HOST" && user.role !== "ADMIN") {
      return apiError(403, "FORBIDDEN", "Host role required");
    }

    const { id } = await ctx.params;
    if (!id) return apiError(400, "BAD_REQUEST", "listing id is required");

    const listing = await prisma.listing.findFirst({
      where: { id, ...(user.role === "HOST" ? { hostId: user.id } : {}) },
      select: { id: true, hostId: true, icalUrl: true },
    });
    if (!listing) return apiError(404, "NOT_FOUND", "Listing not found");
    if (!listing.icalUrl) {
      return apiError(400, "BAD_REQUEST", "iCal URL is not configured for this listing.");
    }

    const url = listing.icalUrl;
    let rawEvents: unknown;
    try {
      rawEvents = await fetchIcalEvents(url);
    } catch (e) {
      console.error("[ical-sync] failed to fetch or parse iCal", e);
      return apiError(400, "BAD_REQUEST", "iCal 데이터를 불러오지 못했습니다. URL을 다시 확인해 주세요.");
    }

    const today = new Date();
    const oneYearLater = new Date(today.getFullYear() + 1, today.getMonth(), today.getDate());

    const values: IcalEventLike[] =
      rawEvents && typeof rawEvents === "object"
        ? (Object.values(rawEvents as Record<string, IcalEventLike>) as IcalEventLike[])
        : [];

    for (const value of values) {
      if (!value || value.type !== "VEVENT") continue;
      const start = value.start instanceof Date ? value.start : null;
      const end = value.end instanceof Date ? value.end : null;
      if (!start || !end) continue;

      const cursor = new Date(start.getFullYear(), start.getMonth(), start.getDate());
      const last = new Date(end.getFullYear(), end.getMonth(), end.getDate());

      while (cursor <= last && cursor <= oneYearLater) {
        if (cursor >= today) {
          await blockDate(listing.id, listing.hostId, new Date(cursor));
        }
        cursor.setDate(cursor.getDate() + 1);
      }
    }

    await prisma.listing.update({
      where: { id: listing.id },
      data: { icalLastSyncedAt: new Date() },
    });

    return apiOk({ ok: true });
  } catch (error) {
    console.error("[api/host/listings/:id/ical-sync] failed", error);
    const message = error instanceof Error ? error.message : "Failed to sync iCal";
    return apiError(500, "INTERNAL_ERROR", message);
  }
}

