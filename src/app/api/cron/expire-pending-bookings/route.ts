import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { expirePendingBookingsOlderThanHours } from "@/lib/repositories/booking-expiry";

const PENDING_EXPIRE_HOURS = 24;

/**
 * 크론에서 호출: 24시간 지난 PENDING_PAYMENT 예약을 CANCELLED로 변경.
 * Vercel Cron 또는 외부 cron에서 GET 호출 시 CRON_SECRET 필요.
 *
 * 예: 0 3 * * * curl -H "Authorization: Bearer $CRON_SECRET" https://your-domain/api/cron/expire-pending-bookings
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
    const count = await expirePendingBookingsOlderThanHours(prisma, PENDING_EXPIRE_HOURS);
    return NextResponse.json({ ok: true, expired: count });
  } catch (e) {
    console.error("[cron/expire-pending-bookings] failed", e);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
