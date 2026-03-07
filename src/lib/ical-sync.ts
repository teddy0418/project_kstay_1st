import { prisma } from "@/lib/db";
import { fetchIcalBlockedDatesWithTimeout, isAllowedIcalUrl } from "@/lib/ical";

function ymdToUtcDate(ymd: string): Date {
  const [y, m, d] = ymd.split("-").map((v) => parseInt(v, 10));
  return new Date(Date.UTC(y ?? 0, (m ?? 1) - 1, d ?? 1));
}

/**
 * 해당 숙소의 모든 iCal 소스(피드 + legacy icalUrl)를 동기화합니다.
 * 인증 없이 호출 가능 (크론 등에서 사용).
 */
export async function performListingIcalSync(listingId: string): Promise<{ ok: boolean; error?: string }> {
  const listing = await prisma.listing.findUnique({
    where: { id: listingId },
    select: { id: true, icalUrl: true },
  });
  if (!listing) return { ok: false, error: "Listing not found" };

  const feeds = await prisma.listingIcalFeed.findMany({
    where: { listingId },
    select: { id: true, url: true, syncEnabled: true },
  });

  const urlsToSync: { url: string; feedId: string | null }[] = [];
  for (const f of feeds) {
    if (f.syncEnabled !== false && f.url?.trim() && isAllowedIcalUrl(f.url)) {
      urlsToSync.push({ url: f.url.trim(), feedId: f.id });
    }
  }
  if (urlsToSync.length === 0 && listing.icalUrl?.trim() && isAllowedIcalUrl(listing.icalUrl)) {
    urlsToSync.push({ url: listing.icalUrl.trim(), feedId: null });
  }
  if (urlsToSync.length === 0) return { ok: false, error: "No iCal URLs" };

  const allYmd = new Set<string>();
  const feedResults: { feedId: string | null; success: boolean; errorMessage?: string }[] = [];

  for (const { url, feedId } of urlsToSync) {
    try {
      const ymd = await fetchIcalBlockedDatesWithTimeout(url);
      ymd.forEach((d) => allYmd.add(d));
      feedResults.push({ feedId, success: true });
    } catch (e) {
      const errMsg = e instanceof Error ? e.message : String(e);
      feedResults.push({
        feedId,
        success: false,
        errorMessage: errMsg === "TIMEOUT" ? "요청 시간 초과" : "불러오기 실패",
      });
    }
  }

  const dateRows = Array.from(allYmd)
    .sort()
    .map((ymd) => ({ listingId, date: ymdToUtcDate(ymd) }));

  const now = new Date();

  await prisma.$transaction(async (tx) => {
    await tx.listingIcalBlockedDate.deleteMany({ where: { listingId } });
    if (dateRows.length > 0) {
      await tx.listingIcalBlockedDate.createMany({ data: dateRows, skipDuplicates: true });
    }
    await tx.listing.update({
      where: { id: listingId },
      data: { icalLastSyncedAt: now },
    });
    for (const r of feedResults) {
      if (r.feedId) {
        await tx.listingIcalFeed.update({
          where: { id: r.feedId },
          data: {
            lastSyncedAt: r.success ? now : undefined,
            lastSyncStatus: r.success ? null : (r.errorMessage ?? "오류"),
          },
        });
      }
    }
  });

  return { ok: true };
}
