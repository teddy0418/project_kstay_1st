"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { apiClient, ApiClientError } from "@/lib/api/client";

type AdminBooking = {
  id: string;
  guestName: string | null;
  guestEmail: string;
  checkIn: string;
  checkOut: string;
  nights: number;
  totalKrw: number;
  status: string;
  createdAt: string;
  listing: { id: string; title: string };
  host: { id: string; name: string | null };
  payment: { status: string; pgTid: string | null } | null;
};

const STATUS_OPTIONS = [
  { value: "", label: "전체" },
  { value: "CONFIRMED", label: "결제 완료" },
  { value: "PENDING_PAYMENT", label: "결제 대기" },
  { value: "CANCELLED", label: "취소" },
];

const STATUS_LABEL: Record<string, string> = {
  CONFIRMED: "결제 완료",
  PENDING_PAYMENT: "결제 대기",
  CANCELLED: "취소",
};

export default function AdminBookingsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const statusParam = searchParams.get("status") ?? "";
  const pageParam = searchParams.get("page") ?? "1";
  const [status, setStatus] = useState(statusParam);
  const [page, setPage] = useState(Math.max(1, parseInt(pageParam, 10) || 1));
  const [items, setItems] = useState<AdminBooking[]>([]);
  const [total, setTotal] = useState(0);
  const PAGE_SIZE = 10;
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (status) params.set("status", status);
      params.set("page", String(page));
      params.set("pageSize", String(PAGE_SIZE));
      const res = await apiClient.get<{ bookings: AdminBooking[]; total: number; page: number; pageSize: number }>(
        `/api/admin/bookings?${params}`
      );
      setItems(Array.isArray(res?.bookings) ? res.bookings : []);
      setTotal(res?.total ?? 0);
    } catch (err) {
      if (err instanceof ApiClientError && (err.status === 401 || err.status === 403)) {
        router.replace("/");
        return;
      }
      setItems([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [status, page, router]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const p = searchParams.get("page");
    setPage(Math.max(1, parseInt(p ?? "1", 10) || 1));
  }, [searchParams.get("page")]);

  const setStatusAndReplace = (v: string) => {
    setStatus(v);
    setPage(1);
    const params = new URLSearchParams();
    if (v) params.set("status", v);
    params.set("page", "1");
    router.replace(`/admin/bookings?${params}`);
  };

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const goToPage = (p: number) => {
    const next = Math.max(1, Math.min(p, totalPages));
    setPage(next);
    const params = new URLSearchParams();
    if (status) params.set("status", status);
    if (next > 1) params.set("page", String(next));
    router.replace(`/admin/bookings${params.toString() ? `?${params}` : ""}`);
  };

  return (
    <div className="grid gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">예약 관리</h1>
          <p className="mt-1 text-sm text-neutral-500">플랫폼 전체 예약 목록입니다. 상태별로 필터할 수 있습니다.</p>
        </div>
        <div>
          <label className="sr-only" htmlFor="admin-bookings-status">상태 필터</label>
          <select
            id="admin-bookings-status"
            value={status}
            onChange={(e) => setStatusAndReplace(e.target.value)}
            className="rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-sm font-medium text-neutral-800"
          >
            {STATUS_OPTIONS.map((o) => (
              <option key={o.value || "all"} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="rounded-2xl border border-neutral-200 bg-white p-8 text-center text-neutral-500">불러오는 중...</div>
      ) : items.length === 0 ? (
        <div className="rounded-2xl border border-neutral-200 bg-white p-8 text-center text-neutral-500">해당하는 예약이 없습니다.</div>
      ) : (
        <div className="w-full min-w-0 overflow-x-auto rounded-2xl border border-neutral-200 bg-white">
          <table className="w-full min-w-[800px] text-sm">
            <thead className="border-b border-neutral-200 bg-neutral-50 text-left text-neutral-600">
              <tr>
                <th className="p-4 font-semibold">예약 ID</th>
                <th className="p-4 font-semibold">게스트</th>
                <th className="p-4 font-semibold">숙소</th>
                <th className="p-4 font-semibold">호스트</th>
                <th className="p-4 font-semibold">체크인 / 체크아웃</th>
                <th className="p-4 font-semibold">금액</th>
                <th className="p-4 font-semibold">상태</th>
                <th className="p-4 font-semibold">결제</th>
              </tr>
            </thead>
            <tbody>
              {items.map((row) => (
                <tr key={row.id} className="border-b border-neutral-100 last:border-0">
                  <td className="p-4 font-mono text-xs text-neutral-600">{row.id}</td>
                  <td className="p-4">
                    <div className="font-medium text-neutral-900">{row.guestName ?? "게스트"}</div>
                    <div className="text-xs text-neutral-500 truncate max-w-[160px]">{row.guestEmail}</div>
                  </td>
                  <td className="p-4 truncate max-w-[180px]" title={row.listing.title}>{row.listing.title}</td>
                  <td className="p-4 text-neutral-700">{row.host.name ?? row.host.id}</td>
                  <td className="p-4 text-neutral-700">
                    {new Date(row.checkIn).toLocaleDateString("ko-KR")} ~ {new Date(row.checkOut).toLocaleDateString("ko-KR")}
                  </td>
                  <td className="p-4">₩{row.totalKrw.toLocaleString()}</td>
                  <td className="p-4">
                    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                      row.status === "CONFIRMED" ? "bg-green-100 text-green-700" :
                      row.status === "CANCELLED" ? "bg-red-100 text-red-700" :
                      "bg-amber-100 text-amber-700"
                    }`}>
                      {STATUS_LABEL[row.status] ?? row.status}
                    </span>
                  </td>
                  <td className="p-4">
                    {row.payment?.status === "PAID" ? (
                      <span className="text-xs text-green-700">결제완료</span>
                    ) : row.payment ? (
                      <span className="text-xs text-neutral-500">{row.payment.status}</span>
                    ) : (
                      <span className="text-xs text-neutral-400">—</span>
                    )}
                    {row.payment?.pgTid && (
                      <div className="font-mono text-xs text-neutral-400 mt-0.5 truncate max-w-[120px]" title={row.payment.pgTid}>{row.payment.pgTid}</div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!loading && total > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-neutral-200 bg-white px-4 py-3">
          <span className="text-sm text-neutral-600">
            총 {total}건 ({(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, total)})
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => goToPage(page - 1)}
              disabled={page <= 1}
              className="rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm font-medium text-neutral-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-neutral-50"
            >
              이전
            </button>
            <span className="text-sm text-neutral-600">
              {page} / {totalPages}
            </span>
            <button
              type="button"
              onClick={() => goToPage(page + 1)}
              disabled={page >= totalPages}
              className="rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm font-medium text-neutral-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-neutral-50"
            >
              다음
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
