"use client";

import { useMemo, useState } from "react";
import type { Booking } from "@/types";
import { useComingSoon } from "@/hooks/useComingSoon";
import { useI18n } from "@/components/ui/LanguageProvider";

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
  const { lang } = useI18n();
  const c =
    lang === "ko"
      ? {
          title: "정산 관리 (MVP)",
          rule: "Ready = [PG 결제완료] + [체크인 시각 이후 24시간]. 현재:",
          booking: "예약",
          readyQ: "정산 가능?",
          hold: "보류",
          action: "액션",
          checkIn: "체크인",
          ready: "가능",
          notReady: "대기",
          pay: "API 지급 (준비중)",
          download: "엑셀 다운로드 (준비중)",
          weekly: "주간 지급 리스트 생성 (준비중)",
        }
      : lang === "ja"
        ? {
            title: "精算管理 (MVP)",
            rule: "Ready = [PG 支払い完了] + [チェックイン時刻から24時間]. 現在:",
            booking: "予約",
            readyQ: "精算可能?",
            hold: "保留",
            action: "操作",
            checkIn: "チェックイン",
            ready: "READY",
            notReady: "NOT READY",
            pay: "API 支払い (準備中)",
            download: "Excel ダウンロード (準備中)",
            weekly: "週次支払いリスト作成 (準備中)",
          }
        : lang === "zh"
          ? {
              title: "结算管理 (MVP)",
              rule: "可结算 = [PG 已支付] + [入住时间后24小时]。当前：",
              booking: "预订",
              readyQ: "可结算？",
              hold: "冻结",
              action: "操作",
              checkIn: "入住",
              ready: "可结算",
              notReady: "未就绪",
              pay: "通过 API 支付（即将上线）",
              download: "下载 Excel（即将上线）",
              weekly: "创建周度付款清单（即将上线）",
            }
          : {
              title: "Settlement management (MVP)",
              rule: "Ready = [PG paid] + [24h after check-in time]. Current:",
              booking: "Booking",
              readyQ: "Ready?",
              hold: "Hold",
              action: "Action",
              checkIn: "check-in",
              ready: "READY",
              notReady: "NOT READY",
              pay: "Pay via API (placeholder)",
              download: "Download Excel (placeholder)",
              weekly: "Create weekly payout list (placeholder)",
            };
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
      <h1 className="text-xl font-semibold">{c.title}</h1>
      <p className="mt-2 text-sm text-neutral-600">
        {c.rule} {nowKSTLabel()}
      </p>

      <div className="mt-6 overflow-x-auto">
        <table className="min-w-[960px] w-full text-sm">
          <thead className="text-left text-neutral-500">
            <tr className="border-b border-neutral-200">
              <th className="py-3 pr-3">{c.booking}</th>
              <th className="py-3 pr-3">pg_tid</th>
              <th className="py-3 pr-3">settlement_id</th>
              <th className="py-3 pr-3">{c.readyQ}</th>
              <th className="py-3 pr-3">{c.hold}</th>
              <th className="py-3 pr-3">{c.action}</th>
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
                      {c.checkIn} {b.checkInDate} 15:00 (KST)
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
                      {ready ? c.ready : c.notReady}
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
                      {c.pay}
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
          {c.download}
        </button>
        <button
          type="button"
          onClick={() => comingSoon({ message: "주간 지급 리스트 생성 기능 준비중입니다." })}
          className="rounded-full border border-neutral-200 px-4 py-2 text-sm hover:bg-neutral-50"
        >
          {c.weekly}
        </button>
      </div>
    </div>
  );
}
