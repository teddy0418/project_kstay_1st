import Link from "next/link";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getCurrentHostFlow } from "@/lib/host/server";
import { getHostListingsForCalendar, getHostDashboardStats, getHostWeekTimeline } from "@/lib/repositories/host-calendar";
import BlockDateButton from "@/features/host/dashboard/BlockDateButton";
import DashboardListingSelector from "@/features/host/dashboard/DashboardListingSelector";

export const dynamic = "force-dynamic";

function formatKRW(n: number) {
  return new Intl.NumberFormat("ko-KR").format(n);
}

type PageProps = { searchParams?: Promise<{ listingId?: string | string[] }> | { listingId?: string | string[] } };

export default async function HostDashboardPage(props: PageProps) {
  const current = await getCurrentHostFlow();
  if (!current) redirect("/login?next=/host/dashboard");

  if (current.status === "NONE") redirect("/host/onboarding");
  if (current.status === "DRAFT") redirect("/host/listings");
  if (current.status === "PENDING") redirect("/host/pending");

  const raw = props.searchParams;
  const params = raw != null && typeof (raw as Promise<unknown>).then === "function"
    ? await (raw as Promise<{ listingId?: string | string[] }>)
    : (raw as { listingId?: string | string[] }) ?? {};
  const listingIdParam = typeof params.listingId === "string" ? params.listingId : params.listingId?.[0];

  const listings = await getHostListingsForCalendar(current.user.id);
  const firstId = listings[0]?.id ?? null;
  const listingId =
    listingIdParam && listings.some((l) => l.id === listingIdParam)
      ? listingIdParam
      : firstId;

  if (listings.length > 0 && !listingIdParam && firstId) {
    redirect(`/host/dashboard?listingId=${encodeURIComponent(firstId)}`);
  }

  const [stats, timeline] = await Promise.all([
    getHostDashboardStats(current.user.id, listingId),
    getHostWeekTimeline(current.user.id, listingId),
  ]);

  const summary: { label: string; value: string | number; danger?: boolean }[] = [
    { label: "오늘 입실", value: stats.todayCheckIn },
    { label: "오늘 퇴실", value: stats.todayCheckOut },
    { label: "새 메시지", value: stats.newMessages },
    { label: "신규 취소", value: Number.isFinite(stats.newCancels) ? stats.newCancels : 0, danger: (stats.newCancels ?? 0) > 0 },
    { label: "정산 예정액", value: `₩${formatKRW(stats.pendingSettlementKrw)}` },
  ];

  const centerFeed = [
    { type: "공지", title: "정산 시스템 점검 안내 (화요일 09:00~10:00)" },
    { type: "팁", title: "외국인 게스트는 셀프 체크인과 와이파이 만족도가 높아요" },
    { type: "가이드", title: "사진은 거실-침실-화장실-뷰 순으로 올리면 전환율이 좋아요" },
  ];

  return (
    <div className="grid gap-6">
      <div>
        <div className="text-xl font-extrabold tracking-tight md:text-3xl">DASHBOARD</div>
        <div className="mt-1 text-xs text-neutral-500 md:text-sm">KSTAY 파트너스 운영을 한눈에 확인하세요</div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-5">
        {summary.map((s) => (
          <div key={s.label} className="rounded-2xl border border-neutral-200 bg-white shadow-sm p-4 min-w-0">
            <div className="text-xs text-neutral-500">{s.label}</div>
            <div className={"mt-2 text-xl font-extrabold truncate " + (s.danger ? "text-red-600" : "text-neutral-900")}>{s.value}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-10 gap-4">
        <div className="lg:col-span-7 rounded-2xl border border-neutral-200 bg-white shadow-sm p-3 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-2 sm:gap-3">
            <div className="text-base sm:text-lg font-bold min-w-0">이번 주 예약 현황</div>
            <div className="flex flex-wrap items-center gap-2">
              <Suspense fallback={<span className="text-sm text-neutral-500">숙소 불러오는 중…</span>}>
                <DashboardListingSelector listings={listings.map((l) => ({ id: l.id, title: l.title }))} />
              </Suspense>
              {listingId && (
                <Link
                  href={`/host/calendar?listingId=${encodeURIComponent(listingId)}`}
                  className="text-sm font-medium text-neutral-600 hover:text-neutral-900 underline"
                >
                  캘린더에서 보기
                </Link>
              )}
            </div>
          </div>
          <p className="mt-2 text-xs text-neutral-500">
            위에서 선택한 숙소만 적용됩니다. 판매 닫기 → 해당 날짜 예약 불가 / 판매 열기 → 다시 예약 가능
          </p>
          <div className="mt-4 grid gap-3">
            {timeline.map((row) => {
              const isBooked = row.status === "BOOKED";
              const isBlocked = !isBooked && row.isBlocked;
              const isEmpty = !isBooked && !row.isBlocked;
              const isPast = row.isPast;
              const rowBg = isPast
                ? "bg-neutral-100 border-neutral-200"
                : isBlocked
                  ? "bg-red-50 border-red-200"
                  : isBooked
                    ? "bg-emerald-50/50 border-emerald-200"
                    : "bg-[#F9FAFB] border-neutral-200";
              const statusText = isPast
                ? "지난 날짜"
                : isBooked
                  ? `예약: ${row.guestName ?? "게스트"}`
                  : isBlocked
                    ? "판매 중지됨 (이 날짜는 예약 불가)"
                    : "빈방 (예약 가능)";
              return (
                <div key={row.date} className={`flex items-center justify-between gap-2 rounded-xl sm:rounded-2xl border px-3 py-2.5 sm:px-4 sm:py-3 ${rowBg}`}>
                  <div>
                    <div className={`text-sm font-semibold ${isPast ? "text-neutral-500" : "text-neutral-900"}`}>
                      {row.dateLabel}
                      {isPast && <span className="ml-1.5 text-xs font-normal text-neutral-400">(지남)</span>}
                    </div>
                    <div className={`text-xs mt-1 ${isPast ? "text-neutral-400" : isBlocked ? "text-red-700" : "text-neutral-600"}`}>
                      {statusText}
                    </div>
                  </div>
                  {isBooked ? (
                    <span className="text-xs font-semibold text-emerald-600">예약중</span>
                  ) : isPast ? (
                    <span className="text-xs text-neutral-400">—</span>
                  ) : (
                    <BlockDateButton date={row.date} isBlocked={row.isBlocked} listingId={listingId} />
                  )}
                </div>
              );
            })}
          </div>
        </div>
        <div className="lg:col-span-3 rounded-2xl border border-neutral-200 bg-white shadow-sm p-4 sm:p-6">
          <div className="text-base sm:text-lg font-bold">빠른 작업</div>
          <div className="mt-2 sm:mt-1 text-xs sm:text-sm text-neutral-500">자주 쓰는 기능</div>
          <div className="mt-3 sm:mt-4 grid gap-2 sm:gap-3">
            <Link href="/host/account" className="rounded-xl sm:rounded-2xl border border-neutral-200 bg-white px-3 py-2.5 sm:px-4 sm:py-3 text-xs sm:text-sm font-semibold hover:bg-neutral-50 transition text-center block">
              정산 계좌 설정
            </Link>
            <Link href="/coming-soon" className="rounded-xl sm:rounded-2xl border border-red-300 bg-white px-3 py-2.5 sm:px-4 sm:py-3 text-xs sm:text-sm font-semibold text-red-600 hover:bg-red-50 transition text-center block">
              전체 판매 중지
            </Link>
            <Link href="/" className="rounded-xl sm:rounded-2xl border border-neutral-200 bg-white px-3 py-2.5 sm:px-4 sm:py-3 text-xs sm:text-sm font-semibold hover:bg-neutral-50 transition text-center block">숙소 미리보기 (게스트 페이지)</Link>
            <Link href="/coming-soon" className="rounded-xl sm:rounded-2xl border border-neutral-200 bg-white px-3 py-2.5 sm:px-4 sm:py-3 text-xs sm:text-sm font-semibold hover:bg-neutral-50 transition text-center block">
              예약자 명단 다운로드
            </Link>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-neutral-200 bg-white shadow-sm p-4 sm:p-6">
        <div className="text-base sm:text-lg font-bold">KSTAY 센터</div>
        <div className="mt-0.5 sm:mt-1 text-xs sm:text-sm text-neutral-500">공지사항 · 운영 인사이트 · 가이드라인</div>
        <div className="mt-3 sm:mt-4 grid gap-2 sm:gap-3">
          {centerFeed.map((x, idx) => (
            <div key={idx} className="flex items-start gap-2 sm:gap-3 rounded-xl sm:rounded-2xl border border-neutral-200 bg-[#F9FAFB] px-3 py-2.5 sm:px-4 sm:py-3 min-w-0">
              <span
                className={[
                  "shrink-0 rounded-full px-2.5 py-0.5 text-[10px] sm:text-xs font-semibold",
                  x.type === "공지" ? "bg-neutral-900 text-white" : x.type === "가이드" ? "bg-emerald-100 text-emerald-800" : "bg-neutral-100 text-neutral-700",
                ].join(" ")}
              >
                {x.type}
              </span>
              <div className="min-w-0 flex-1 text-xs sm:text-sm font-semibold text-neutral-900 leading-snug">{x.title}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
