import { NextRequest, NextResponse } from "next/server";
import { getServerSessionUser } from "@/lib/auth/server";
import { prisma } from "@/lib/db";
import { findPastStaysByGuestUserId } from "@/lib/repositories/bookings";

/** 개발 시 Your trips 미표시 원인 확인용. 프로덕션에서는 404. ?html=1 이면 읽기 쉬운 HTML로 표시 */
export async function GET(req: NextRequest) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const user = await getServerSessionUser();
  if (!user) {
    const data = {
      ok: false,
      message: "로그인되지 않음",
      sessionUserId: null,
      sessionEmail: null,
    };
    if (req.nextUrl.searchParams.get("html") === "1") {
      return new NextResponse(htmlPage(data), {
        headers: { "Content-Type": "text/html; charset=utf-8" },
      });
    }
    return NextResponse.json(data);
  }

  const adminEmail = "official.kstay@gmail.com";
  const userByEmail = await prisma.user.findUnique({
    where: { email: adminEmail },
    select: { id: true, email: true },
  });

  const pastStays = await findPastStaysByGuestUserId(user.id);
  const now = new Date();
  const startOfTodayUtc = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0));

  const anyPastBookingForAdmin = await prisma.booking.findFirst({
    where: {
      guestUserId: userByEmail?.id ?? undefined,
      status: "CONFIRMED",
      checkOut: { lt: startOfTodayUtc },
    },
    select: { id: true, checkOut: true, guestUserId: true },
  });

  const data = {
    ok: true,
    sessionUserId: user.id,
    sessionEmail: user.email ?? null,
    sessionIdMatchesAdminUser: userByEmail ? user.id === userByEmail.id : false,
    adminUserInDb: userByEmail ? { id: userByEmail.id, email: userByEmail.email } : null,
    pastStaysCount: pastStays.length,
    pastStaysBookingIds: pastStays.map((b) => b.id),
    anyPastBookingForAdminEmailUser: anyPastBookingForAdmin,
    serverNow: new Date().toISOString(),
    startOfTodayUtc: startOfTodayUtc.toISOString(),
  };

  if (req.nextUrl.searchParams.get("html") === "1") {
    return new NextResponse(htmlPage(data), {
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  }
  return NextResponse.json(data);
}

function htmlPage(data: Record<string, unknown>): string {
  const sessionEmail = (data.sessionEmail as string) ?? "-";
  const pastStaysCount = (data.pastStaysCount as number) ?? 0;
  const anyBooking = data.anyPastBookingForAdminEmailUser as { id: string; checkOut: string; guestUserId: string } | null;
  const match = (data.sessionIdMatchesAdminUser as boolean) ?? false;

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Check Trips</title></head>
<body style="font-family: sans-serif; padding: 2rem; max-width: 600px;">
  <h1>Your trips 디버그</h1>
  <ul style="line-height: 2;">
    <li><b>로그인 여부:</b> ${data.ok ? "예" : "아니오"}</li>
    <li><b>sessionEmail:</b> ${sessionEmail}</li>
    <li><b>pastStaysCount (과거 숙소 개수):</b> ${pastStaysCount}</li>
    <li><b>세션 id가 admin 계정과 일치:</b> ${match ? "예" : "아니오"}</li>
    <li><b>admin 계정 예시 예약 있음:</b> ${anyBooking ? "예 (id: " + anyBooking.id + ")" : "없음"}</li>
  </ul>
  <p style="color:#666;">원본 JSON: <a href="?">JSON으로 보기</a></p>
</body>
</html>`;
}
