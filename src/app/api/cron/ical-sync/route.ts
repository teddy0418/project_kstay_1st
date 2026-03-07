import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { performListingIcalSync } from "@/lib/ical-sync";

/**
 * 크론에서 호출: iCal URL이 등록된 모든 숙소의 외부 캘린더를 동기화합니다.
 * Vercel Cron 또는 외부 cron에서 GET 호출 시 CRON_SECRET 필요.
 *
 * 예 (6시간마다): 0 0,6,12,18 * * * curl -H "Authorization: Bearer $CRON_SECRET" https://your-domain/api/cron/ical-sync
 */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = req.headers.get("authorization");
    const token = auth?.startsWith("Bearer ") ? auth.slice(7) : null;
    if (token !== secret) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  try {
    const listings = await prisma.listing.findMany({
      where: {
        OR: [{ icalUrl: { not: null } }, { icalFeeds: { some: {} } }],
      },
      select: { id: true },
    });
    const listingIds = listings.map((l) => l.id);

    let synced = 0;
    let failed = 0;
    for (const id of listingIds) {
      const result = await performListingIcalSync(id);
      if (result.ok) synced++;
      else failed++;
    }

    return NextResponse.json({ ok: true, synced, failed, total: listingIds.length });
  } catch (e) {
    console.error("[cron/ical-sync] failed", e);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
