"use client";

import { useCallback, useEffect, useState } from "react";
import { apiClient } from "@/lib/api/client";
import { useComingSoon } from "@/hooks/useComingSoon";

type SettlementRow = {
  id: string;
  checkIn: string;
  checkOut: string;
  totalKrw: number;
  guestName: string | null;
  listingId: string;
  listingTitle: string;
  host: { id: string; name: string | null };
  pgTid: string | null;
  paymentStatus: string;
  readyAt: string;
};

function nowKSTLabel() {
  const fmt = new Intl.DateTimeFormat("ko-KR", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  return `${fmt.format(new Date())} (KST)`;
}

/** 결제 완료 + 체크인 24시간 경과 시 정산 가능 */
function isSettlementReady(row: SettlementRow, nowMs: number): boolean {
  const paidOk = row.paymentStatus === "PAID" && Boolean(row.pgTid);
  const readyAtMs = new Date(row.readyAt).getTime();
  return paidOk && nowMs >= readyAtMs;
}

export default function AdminSettlementsPage() {
  const [rows, setRows] = useState<SettlementRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [holds, setHolds] = useState<Record<string, boolean>>({});
  const [now, setNow] = useState(() => Date.now());
  const comingSoon = useComingSoon();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiClient.get<SettlementRow[]>("/api/admin/settlements");
      setRows(Array.isArray(data) ? data : []);
    } catch {
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 60 * 1000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-6">
      <h1 className="text-xl font-semibold">정산 관리 (MVP)</h1>
      <p className="mt-2 text-sm text-neutral-600">
        정산 가능 = [PG 결제완료] + [체크인 시각 이후 24시간]. 현재: {nowKSTLabel()}
      </p>

      {loading ? (
        <div className="mt-6 py-8 text-center text-neutral-500">불러오는 중...</div>
      ) : rows.length === 0 ? (
        <div className="mt-6 py-8 text-center text-neutral-500">정산 후보 예약이 없습니다. (결제 완료된 CONFIRMED 예약만 표시됩니다)</div>
      ) : (
        <div className="mt-6 overflow-x-auto">
          <table className="min-w-[960px] w-full text-sm">
            <thead className="text-left text-neutral-500">
              <tr className="border-b border-neutral-200">
                <th className="py-3 pr-3">예약</th>
                <th className="py-3 pr-3">숙소 / 호스트</th>
                <th className="py-3 pr-3">pg_tid</th>
                <th className="py-3 pr-3">정산 가능?</th>
                <th className="py-3 pr-3">보류</th>
                <th className="py-3 pr-3">액션</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((b) => {
                const ready = isSettlementReady(b, now) && !holds[b.id];
                const hold = Boolean(holds[b.id]);

                return (
                  <tr key={b.id} className="border-b border-neutral-200">
                    <td className="py-4 pr-3">
                      <div className="font-semibold">{b.id}</div>
                      <div className="text-xs text-neutral-500">
                        체크인 {new Date(b.checkIn).toLocaleDateString("ko-KR")} · {b.guestName ?? "—"} · ₩{b.totalKrw.toLocaleString()}
                      </div>
                    </td>
                    <td className="py-4 pr-3">
                      <div className="truncate max-w-[180px]">{b.listingTitle}</div>
                      <div className="text-xs text-neutral-500">{b.host.name ?? b.host.id}</div>
                    </td>
                    <td className="py-4 pr-3 font-mono text-xs">{b.pgTid ?? "-"}</td>
                    <td className="py-4 pr-3">
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                          ready ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                        }`}
                      >
                        {ready ? "가능" : "대기"}
                      </span>
                    </td>
                    <td className="py-4 pr-3">
                      <button
                        type="button"
                        onClick={() => setHolds((h) => ({ ...h, [b.id]: !h[b.id] }))}
                        className="rounded-full border border-neutral-200 px-3 py-1 text-xs hover:bg-neutral-50"
                      >
                        {hold ? "보류 중" : "해제"}
                      </button>
                    </td>
                    <td className="py-4 pr-3">
                      <button
                        type="button"
                        onClick={() => comingSoon({ message: "정산 API 연동 준비중입니다." })}
                        className="rounded-full bg-neutral-900 px-3 py-2 text-xs font-semibold text-white hover:opacity-95 disabled:opacity-40 disabled:pointer-events-none"
                        disabled={!ready}
                      >
                        API 지급 (준비중)
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <div className="mt-6 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => comingSoon({ message: "엑셀 다운로드 기능 준비중입니다." })}
          className="rounded-full border border-neutral-200 px-4 py-2 text-sm hover:bg-neutral-50"
        >
          엑셀 다운로드 (준비중)
        </button>
        <button
          type="button"
          onClick={() => comingSoon({ message: "주간 지급 리스트 생성 기능 준비중입니다." })}
          className="rounded-full border border-neutral-200 px-4 py-2 text-sm hover:bg-neutral-50"
        >
          주간 지급 리스트 생성 (준비중)
        </button>
      </div>
    </div>
  );
}
