"use client";

import { useMemo, useState } from "react";
import type { Booking } from "@/types";
import { useComingSoon } from "@/hooks/useComingSoon";

function nowKSTLabel() {
  const fmt = new Intl.DateTimeFormat("en-US", {
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

export default function AdminSettlementsPage() {
  const [holds, setHolds] = useState<Record<string, boolean>>({});
  const comingSoon = useComingSoon();

  const bookings: Booking[] = useMemo(
    () => [
      {
        id: "bk_001",
        listingId: "seoul-seongsu-studio",
        guestName: "Alex",
        checkInDate: "2026-02-10",
        checkOutDate: "2026-02-13",
        guests: 2,
        currency: "USD",
        pg_tid: "pg_tid_demo_001",
        settlement_id: undefined,
        status: "CONFIRMED",
        createdAt: "2026-02-01T10:00:00.000Z",
      },
      {
        id: "bk_002",
        listingId: "busan-haeundae-ocean",
        guestName: "Mina",
        checkInDate: "2026-02-13",
        checkOutDate: "2026-02-15",
        guests: 2,
        currency: "USD",
        pg_tid: "pg_tid_demo_002",
        settlement_id: undefined,
        status: "CONFIRMED",
        createdAt: "2026-02-05T10:00:00.000Z",
      },
    ],
    []
  );

  const [now] = useState(() => Date.now());

  function kstCheckInDateTimeUtcMs(checkInDate: string, checkInTime: string) {
    const [y, m, d] = checkInDate.split("-").map(Number);
    const [hh, mm] = checkInTime.split(":").map(Number);
    return Date.UTC(y, (m ?? 1) - 1, d ?? 1, (hh ?? 0) - 9, mm ?? 0);
  }

  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-6">
      <h1 className="text-xl font-semibold">Settlement management (MVP)</h1>
      <p className="mt-2 text-sm text-neutral-600">
        Ready = [PG paid] + [24h after check-in time]. Current: {nowKSTLabel()}
      </p>

      <div className="mt-6 overflow-x-auto">
        <table className="min-w-[960px] w-full text-sm">
          <thead className="text-left text-neutral-500">
            <tr className="border-b border-neutral-200">
              <th className="py-3 pr-3">Booking</th>
              <th className="py-3 pr-3">pg_tid</th>
              <th className="py-3 pr-3">settlement_id</th>
              <th className="py-3 pr-3">Ready?</th>
              <th className="py-3 pr-3">Hold</th>
              <th className="py-3 pr-3">Action</th>
            </tr>
          </thead>
          <tbody>
            {bookings.map((b) => {
              const readyAt =
                kstCheckInDateTimeUtcMs(b.checkInDate, "15:00") +
                24 * 60 * 60 * 1000;
              const paidOk = Boolean(b.pg_tid);
              const hold = Boolean(holds[b.id]);
              const ready = paidOk && now >= readyAt && !hold;

              return (
                <tr key={b.id} className="border-b border-neutral-200">
                  <td className="py-4 pr-3">
                    <div className="font-semibold">{b.id}</div>
                    <div className="text-xs text-neutral-500">
                      check-in {b.checkInDate} 15:00 (KST)
                    </div>
                  </td>
                  <td className="py-4 pr-3 font-mono text-xs">{b.pg_tid ?? "-"}</td>
                  <td className="py-4 pr-3 font-mono text-xs">{b.settlement_id ?? "-"}</td>
                  <td className="py-4 pr-3">
                    <span
                      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                        ready ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                      }`}
                    >
                      {ready ? "READY" : "NOT READY"}
                    </span>
                  </td>
                  <td className="py-4 pr-3">
                    <button
                      type="button"
                      onClick={() => setHolds((h) => ({ ...h, [b.id]: !h[b.id] }))}
                      className="rounded-full border border-neutral-200 px-3 py-1 text-xs hover:bg-neutral-50"
                    >
                      {hold ? "ON" : "OFF"}
                    </button>
                  </td>
                  <td className="py-4 pr-3">
                    <button
                      type="button"
                      onClick={() => comingSoon({ message: "정산 API 연동 준비중입니다." })}
                      className="rounded-full bg-neutral-900 px-3 py-2 text-xs font-semibold text-white hover:opacity-95 disabled:opacity-40 disabled:pointer-events-none"
                      disabled={!ready}
                    >
                      Pay via API (placeholder)
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => comingSoon({ message: "엑셀 다운로드 기능 준비중입니다." })}
          className="rounded-full border border-neutral-200 px-4 py-2 text-sm hover:bg-neutral-50"
        >
          Download Excel (placeholder)
        </button>
        <button
          type="button"
          onClick={() => comingSoon({ message: "주간 지급 리스트 생성 기능 준비중입니다." })}
          className="rounded-full border border-neutral-200 px-4 py-2 text-sm hover:bg-neutral-50"
        >
          Create weekly payout list (placeholder)
        </button>
      </div>
    </div>
  );
}
