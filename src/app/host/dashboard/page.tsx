import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentHostFlow } from "@/lib/host/server";

function formatKR(d: Date) {
  return new Intl.DateTimeFormat("ko-KR", { month: "numeric", day: "numeric", weekday: "short" }).format(d);
}

export default async function HostDashboardPage() {
  const current = await getCurrentHostFlow();
  if (!current) redirect("/login?next=/host/dashboard");

  if (current.status === "NONE") redirect("/host/onboarding");
  if (current.status === "PENDING") redirect("/host/pending");

  const today = new Date();
  const days = Array.from({ length: 7 }, (_, i) => new Date(today.getTime() + i * 86400000));

  const summary = [
    { label: "오늘 입실", value: 2 },
    { label: "오늘 퇴실", value: 1 },
    { label: "새 메시지", value: 3 },
    { label: "신규 취소", value: 1, danger: true },
    { label: "정산 예정액", value: "₩1,240,000" },
  ];

  const timeline = days.map((d, i) => {
    if (i === 0) return { date: formatKR(d), status: "예약: John (2명)", empty: false };
    if (i === 2) return { date: formatKR(d), status: "예약: Emma (1명)", empty: false };
    return { date: formatKR(d), status: "빈방", empty: true };
  });

  const centerFeed = [
    { type: "공지", title: "정산 시스템 점검 안내 (화요일 09:00~10:00)" },
    { type: "팁", title: "외국인 게스트는 셀프 체크인과 와이파이 만족도가 높아요" },
    { type: "가이드", title: "사진은 거실-침실-화장실-뷰 순으로 올리면 전환율이 좋아요" },
  ];

  return (
    <div className="grid gap-6">
      <div className="flex items-end justify-between">
        <div>
          <div className="text-3xl font-extrabold tracking-tight">DASHBOARD</div>
          <div className="mt-1 text-sm text-neutral-500">KSTAY 파트너스 운영을 한눈에 확인하세요</div>
        </div>
        <Link href="/" className="rounded-2xl border border-neutral-200 bg-white px-5 py-3 text-sm font-semibold hover:bg-neutral-50 transition">
          게스트 모드로 전환
        </Link>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {summary.map((s) => (
          <div key={s.label} className="rounded-2xl border border-neutral-200 bg-white shadow-sm p-4">
            <div className="text-xs text-neutral-500">{s.label}</div>
            <div className={"mt-2 text-xl font-extrabold " + (s.danger ? "text-red-600" : "text-neutral-900")}>{s.value}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-10 gap-4">
        <div className="lg:col-span-7 rounded-3xl border border-neutral-200 bg-white shadow-sm p-6">
          <div className="text-lg font-bold">이번 주 예약 현황</div>
          <div className="mt-4 grid gap-3">
            {timeline.map((row) => (
              <div key={row.date} className="flex items-center justify-between rounded-2xl border border-neutral-200 bg-[#F9FAFB] px-4 py-3">
                <div>
                  <div className="text-sm font-semibold">{row.date}</div>
                  <div className="text-xs text-neutral-600 mt-1">{row.status}</div>
                </div>
                {row.empty ? (
                  <Link href="/coming-soon" className="rounded-xl border border-neutral-200 bg-white px-3 py-2 text-xs font-semibold hover:bg-neutral-50 transition">
                    판매 닫기
                  </Link>
                ) : (
                  <span className="text-xs font-semibold text-emerald-600">예약중</span>
                )}
              </div>
            ))}
          </div>
        </div>
        <div className="lg:col-span-3 rounded-3xl border border-neutral-200 bg-white shadow-sm p-6">
          <div className="text-lg font-bold">빠른 작업</div>
          <div className="mt-4 grid gap-3">
            <Link href="/coming-soon" className="rounded-2xl border border-red-300 bg-white px-4 py-3 text-sm font-semibold text-red-600 hover:bg-red-50 transition text-center">
              전체 판매 중지
            </Link>
            <Link href="/" className="rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm font-semibold hover:bg-neutral-50 transition text-center block">숙소 미리보기 (게스트 페이지)</Link>
            <Link href="/coming-soon" className="rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm font-semibold hover:bg-neutral-50 transition text-center">
              예약자 명단 다운로드
            </Link>
          </div>
        </div>
      </div>

      <div className="rounded-3xl border border-neutral-200 bg-white shadow-sm p-6">
        <div className="text-lg font-bold">KSTAY 센터</div>
        <div className="mt-4 grid gap-3">
          {centerFeed.map((x, idx) => (
            <div key={idx} className="flex items-start gap-3 rounded-2xl border border-neutral-200 bg-[#F9FAFB] px-4 py-3">
              <span className="text-xs font-bold text-neutral-700 mt-0.5">{x.type}</span>
              <div className="text-sm font-semibold text-neutral-900">{x.title}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
