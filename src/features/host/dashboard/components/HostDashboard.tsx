"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Download, Eye, Power, XCircle } from "lucide-react";
import { useComingSoon } from "@/hooks/useComingSoon";

type WeekRow = {
  dateLabel: string;     // 예: 2/16(일)
  iso: string;           // YYYY-MM-DD
  guestName?: string;    // 예약자명
  status: "BOOKED" | "EMPTY";
};

type CenterItem = {
  type: "공지" | "팁";
  title: string;
  date: string;
};

function formatKRW(n: number) {
  return new Intl.NumberFormat("ko-KR").format(n);
}

function todayISO() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function addDaysISO(baseISO: string, add: number) {
  const [y, m, d] = baseISO.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  dt.setDate(dt.getDate() + add);
  const yy = dt.getFullYear();
  const mm = String(dt.getMonth() + 1).padStart(2, "0");
  const dd = String(dt.getDate()).padStart(2, "0");
  return `${yy}-${mm}-${dd}`;
}

function labelKR(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  const w = new Intl.DateTimeFormat("ko-KR", { weekday: "short" }).format(dt);
  return `${m}/${d}(${w})`;
}

function buildWeek(): WeekRow[] {
  const base = todayISO();
  const booked = new Map<string, string>([
    [addDaysISO(base, 1), "Michael"],
    [addDaysISO(base, 3), "Yuki"],
    [addDaysISO(base, 5), "Hana"],
  ]);

  return Array.from({ length: 7 }).map((_, i) => {
    const iso = addDaysISO(base, i);
    const guestName = booked.get(iso);
    return {
      iso,
      dateLabel: labelKR(iso),
      guestName,
      status: guestName ? "BOOKED" : "EMPTY",
    };
  });
}

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl border border-neutral-200 bg-white shadow-sm ${className}`}>
      {children}
    </div>
  );
}

function StatCard({
  title,
  value,
  tone = "normal",
  suffix,
}: {
  title: string;
  value: string;
  tone?: "normal" | "danger";
  suffix?: string;
}) {
  const danger = tone === "danger";
  return (
    <Card className={`p-4 ${danger ? "border-red-200" : ""}`}>
      <div className="text-xs font-semibold text-neutral-500">{title}</div>
      <div className={`mt-2 text-2xl font-extrabold tracking-tight ${danger ? "text-red-600" : ""}`}>
        {value}{suffix ? <span className="ml-1 text-sm font-semibold text-neutral-500">{suffix}</span> : null}
      </div>
    </Card>
  );
}

export default function HostDashboard() {
  const week = useMemo(() => buildWeek(), []);
  const [closed, setClosed] = useState<Record<string, boolean>>({});
  const comingSoon = useComingSoon();

  const stats = useMemo(() => {
    const today = todayISO();

    const todayCheckIn = week.filter((r) => r.iso === today && r.status === "BOOKED").length;
    const todayCheckOut = 0; // MVP: 체크아웃 데이터 연동 전
    const newMessages = 2;   // MVP: 메시지 연동 전
    const newCancels = 1;    // MVP: 취소 연동 전 (0이면 자동으로 평온)
    const pendingSettlement = 1280000; // MVP: 정산 연동 전

    return { todayCheckIn, todayCheckOut, newMessages, newCancels, pendingSettlement };
  }, [week]);

  const centerFeed: CenterItem[] = [
    { type: "공지", title: "정산 시스템 점검 안내 (화요일 오전 02:00 ~ 03:00)", date: "오늘" },
    { type: "팁", title: "외국인 게스트는 '셀프 체크인' 안내가 명확할수록 만족도가 올라갑니다.", date: "어제" },
    { type: "공지", title: "숙소 사진 가이드 업데이트: '침대/욕실/창문뷰' 3컷은 필수!", date: "2일 전" },
    { type: "팁", title: "영문 안내문은 짧고 단정하게: 규칙은 5개 이하로 정리하세요.", date: "3일 전" },
  ];

  const downloadRosterCSV = () => {
    const rows = week
      .filter((r) => r.status === "BOOKED")
      .map((r) => ({
        date: r.iso,
        guest: r.guestName ?? "",
      }));

    const header = "date,guest";
    const body = rows.map((x) => `${x.date},${x.guest}`).join("\n");
    const csv = `${header}\n${body}\n`;

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `kstay_roster_${todayISO()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-8">
      {/* 1) 최상단 요약 카드 5개 */}
      <section>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <StatCard title="오늘 입실" value={String(stats.todayCheckIn)} suffix="건" />
          <StatCard title="오늘 퇴실" value={String(stats.todayCheckOut)} suffix="건" />
          <StatCard title="새 메시지" value={String(stats.newMessages)} suffix="개" />
          <StatCard title="신규 취소" value={String(stats.newCancels)} suffix="건" tone={stats.newCancels > 0 ? "danger" : "normal"} />
          <StatCard title="정산 예정액" value={formatKRW(stats.pendingSettlement)} suffix="원" />
        </div>
      </section>

      {/* 2) 중단 데이터 7:3 */}
      <section className="grid gap-6 lg:grid-cols-[7fr,3fr]">
        {/* Left: 이번 주 예약 현황 */}
        <Card className="p-6">
          <div className="flex items-end justify-between gap-3">
            <div>
              <div className="text-lg font-bold">이번 주 예약 현황</div>
              <div className="mt-1 text-sm text-neutral-500">오늘부터 7일간의 예약/빈방 상태를 확인하세요.</div>
            </div>
          </div>

          <div className="mt-5 divide-y divide-neutral-100">
            {week.map((r) => {
              const isClosed = !!closed[r.iso];
              const isEmpty = r.status === "EMPTY";
              return (
                <div key={r.iso} className="flex items-center justify-between gap-3 py-4">
                  <div className="min-w-0">
                    <div className="text-sm font-semibold">{r.dateLabel}</div>
                    <div className="mt-1 text-sm text-neutral-600">
                      {r.status === "BOOKED" ? (
                        <span>
                          예약자: <span className="font-semibold text-neutral-900">{r.guestName}</span>
                        </span>
                      ) : isClosed ? (
                        <span className="inline-flex items-center gap-2 text-red-600">
                          <XCircle className="h-4 w-4" /> 판매 중지됨
                        </span>
                      ) : (
                        <span className="text-neutral-500">빈방</span>
                      )}
                    </div>
                  </div>

                  {isEmpty && (
                    <button
                      type="button"
                      onClick={() => setClosed((p) => ({ ...p, [r.iso]: !p[r.iso] }))}
                      className={[
                        "shrink-0 rounded-xl border px-4 py-2 text-sm font-semibold transition",
                        isClosed ? "border-neutral-200 bg-white hover:bg-neutral-50" : "border-neutral-900 bg-neutral-900 text-white hover:opacity-95",
                      ].join(" ")}
                    >
                      {isClosed ? "판매 열기" : "판매 닫기"}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </Card>

        {/* Right: 빠른 작업 */}
        <Card className="p-6">
          <div className="text-lg font-bold">빠른 작업</div>
          <div className="mt-1 text-sm text-neutral-500">자주 쓰는 기능을 빠르게 실행합니다.</div>

          <div className="mt-5 grid gap-3">
            <button
              type="button"
              onClick={() => comingSoon({ message: "MVP: 전체 판매 중지 기능은 DB 연동 후 활성화됩니다." })}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-300 bg-white px-4 py-3 text-sm font-semibold text-red-700 hover:bg-red-50 transition"
            >
              <Power className="h-4 w-4" />
              전체 판매 중지
            </button>

            <Link
              href="/"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm font-semibold hover:bg-neutral-50 transition"
            >
              <Eye className="h-4 w-4" />
              숙소 미리보기(게스트)
            </Link>

            <button
              type="button"
              onClick={downloadRosterCSV}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm font-semibold hover:bg-neutral-50 transition"
            >
              <Download className="h-4 w-4" />
              예약자 명단 다운로드(CSV)
            </button>
          </div>
        </Card>
      </section>

      {/* 3) 하단 정보: KSTAY 센터 */}
      <section>
        <Card className="p-6">
          <div className="flex items-end justify-between gap-3">
            <div>
              <div className="text-lg font-bold">KSTAY 센터</div>
              <div className="mt-1 text-sm text-neutral-500">공지사항 · 운영 인사이트 · 가이드라인</div>
            </div>
          </div>

          <div className="mt-5 space-y-3">
            {centerFeed.map((it, idx) => (
              <div key={idx} className="flex items-start gap-4 rounded-xl border border-neutral-200 bg-white p-4">
                <div
                  className={[
                    "mt-0.5 shrink-0 rounded-full px-3 py-1 text-xs font-semibold",
                    it.type === "공지" ? "bg-neutral-900 text-white" : "bg-neutral-100 text-neutral-700",
                  ].join(" ")}
                >
                  {it.type}
                </div>

                <div className="min-w-0">
                  <div className="text-sm font-semibold leading-6">{it.title}</div>
                  <div className="mt-1 text-xs text-neutral-500">{it.date}</div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </section>
    </div>
  );
}
