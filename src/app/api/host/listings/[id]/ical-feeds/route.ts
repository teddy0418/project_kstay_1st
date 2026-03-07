import { apiError, apiOk } from "@/lib/api/response";
import { getOrCreateServerUser } from "@/lib/auth/server";
import { prisma } from "@/lib/db";
import { isAllowedIcalUrl } from "@/lib/ical";

/** 소유권 확인 후 listingId 반환 */
async function ensureListingAccess(
  listingId: string,
  userId: string,
  role: string
): Promise<{ id: string } | null> {
  const listing = await prisma.listing.findFirst({
    where: {
      id: listingId,
      ...(role === "ADMIN" ? {} : { hostId: userId }),
    },
    select: { id: true },
  });
  return listing;
}

/** GET: 해당 숙소의 iCal 피드 목록 */
export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const user = await getOrCreateServerUser();
    if (!user) return apiError(401, "UNAUTHORIZED", "Login required");

    const { id: listingId } = await ctx.params;
    if (!listingId) return apiError(400, "BAD_REQUEST", "listing id is required");

    const listing = await ensureListingAccess(listingId, user.id, user.role ?? "");
    if (!listing) return apiError(404, "NOT_FOUND", "Listing not found");

    const feeds = await prisma.listingIcalFeed.findMany({
      where: { listingId },
      select: { id: true, name: true, url: true, syncEnabled: true, lastSyncedAt: true, lastSyncStatus: true },
      orderBy: { createdAt: "asc" },
    });

    return apiOk(
      feeds.map((f) => ({
        id: f.id,
        name: f.name,
        url: f.url,
        syncEnabled: f.syncEnabled,
        lastSyncedAt: f.lastSyncedAt?.toISOString() ?? null,
        lastSyncStatus: f.lastSyncStatus ?? null,
      }))
    );
  } catch (error) {
    console.error("[api/host/listings/:id/ical-feeds] GET failed", error);
    return apiError(500, "INTERNAL_ERROR", "Failed to load iCal feeds");
  }
}

/** POST: iCal 피드 추가. body: { name?: string, url: string } */
export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const user = await getOrCreateServerUser();
    if (!user) return apiError(401, "UNAUTHORIZED", "Login required");

    const { id: listingId } = await ctx.params;
    if (!listingId) return apiError(400, "BAD_REQUEST", "listing id is required");

    const listing = await ensureListingAccess(listingId, user.id, user.role ?? "");
    if (!listing) return apiError(404, "NOT_FOUND", "Listing not found");

    let body: { name?: string; url?: string };
    try {
      body = await req.json();
    } catch {
      return apiError(400, "BAD_REQUEST", "Invalid JSON");
    }
    const url = typeof body.url === "string" ? body.url.trim() : "";
    if (!url) return apiError(400, "BAD_REQUEST", "url은 필수입니다.");
    if (!isAllowedIcalUrl(url)) {
      return apiError(400, "BAD_REQUEST", "iCal URL은 https로 시작하는 주소만 사용할 수 있습니다.");
    }
    const name = (typeof body.name === "string" ? body.name.trim() : "") || "외부 캘린더";

    const feed = await prisma.listingIcalFeed.create({
      data: { listingId, name, url },
      select: { id: true, name: true, url: true, syncEnabled: true, lastSyncedAt: true, lastSyncStatus: true },
    });

    return apiOk({
      id: feed.id,
      name: feed.name,
      url: feed.url,
      syncEnabled: feed.syncEnabled,
      lastSyncedAt: feed.lastSyncedAt?.toISOString() ?? null,
      lastSyncStatus: feed.lastSyncStatus ?? null,
    });
  } catch (error) {
    console.error("[api/host/listings/:id/ical-feeds] POST failed", error);
    const msg = error instanceof Error ? error.message : String(error);
    if (msg.includes("Unique constraint") || msg.includes("listingId_url")) {
      return apiError(409, "CONFLICT", "이미 같은 URL이 등록되어 있습니다.");
    }
    return apiError(500, "INTERNAL_ERROR", "Failed to add iCal feed");
  }
}
