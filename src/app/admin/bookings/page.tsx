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
  cancelledBy: string | null;
  updatedAt: string;
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

const CANCELLED_BY_OPTIONS = [
  { value: "", label: "취소 주체 전체" },
  { value: "GUEST", label: "게스트 측 취소" },
  { value: "HOST", label: "호스트 측 취소" },
];

function getStatusLabel(row: AdminBooking): string {
  if (row.status === "CONFIRMED") return "결제 완료";
  if (row.status === "PENDING_PAYMENT") return "결제 대기";
  if (row.status === "CANCELLED") {
    if (row.cancelledBy === "GUEST") return "게스트 측 취소";
    if (row.cancelledBy === "HOST") return "호스트 측 취소";
    return "취소";
  }
  return row.status;
}

function formatCancelledAt(updatedAt: string): string {
  return new Date(updatedAt).toLocaleString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

export default function AdminBookingsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const statusParam = searchParams.get("status") ?? "";
  const cancelledByParam = searchParams.get("cancelledBy") ?? "";
  const pageParam = searchParams.get("page") ?? "1";
  const [status, setStatus] = useState(statusParam);
  const [cancelledBy, setCancelledBy] = useState(cancelledByParam);
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
      if (status === "CANCELLED" && cancelledBy) params.set("cancelledBy", cancelledBy);
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
  }, [status, cancelledBy, page, router]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const p = searchParams.get("page");
    setPage(Math.max(1, parseInt(p ?? "1", 10) || 1));
  }, [searchParams.get("page")]);
  useEffect(() => {
    setCancelledBy(searchParams.get("cancelledBy") ?? "");
  }, [searchParams.get("cancelledBy")]);

  const setStatusAndReplace = (v: string) => {
    setStatus(v);
    setPage(1);
    const params = new URLSearchParams();
    if (v) params.set("status", v);
    if (cancelledBy && v === "CANCELLED") params.set("cancelledBy", cancelledBy);
    params.set("page", "1");
    router.replace(`/admin/bookings?${params}`);
  };

  const setCancelledByAndReplace = (v: string) => {
    setCancelledBy(v);
    setPage(1);
    const params = new URLSearchParams();
    if (status) params.set("status", status);
    if (v) params.set("cancelledBy", v);
    params.set("page", "1");
    router.replace(`/admin/bookings?${params}`);
  };

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const goToPage = (p: number) => {
    const next = Math.max(1, Math.min(p, totalPages));
    setPage(next);
    const params = new URLSearchParams();
    if (status) params.set("status", status);
    if (cancelledBy) params.set("cancelledBy", cancelledBy);
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
        <div className="flex flex-wrap items-center gap-2">
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
          {status === "CANCELLED" && (
            <>
              <label className="sr-only" htmlFor="admin-bookings-cancelledBy">취소 주체</label>
              <select
                id="admin-bookings-cancelledBy"
                value={cancelledBy}
                onChange={(e) => setCancelledByAndReplace(e.target.value)}
                className="rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-sm font-medium text-neutral-800"
              >
                {CANCELLED_BY_OPTIONS.map((o) => (
                  <option key={o.value || "all"} value={o.value}>{o.label}</option>
                ))}
              </select>
            </>
          )}
        </div>
      </div>

      {loading ? (
        <div className="rounded-2xl border border-neutral-200 bg-white p-8 text-center text-neutral-500">불러오는 중...</div>
      ) : items.length === 0 ? (
        <div className="rounded-2xl border border-neutral-200 bg-white p-8 text-center text-neutral-500">해당하는 예약이 없습니다.</div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden md:block w-full min-w-0 overflow-x-auto rounded-2xl border border-neutral-200 bg-white">
            <table className="w-full text-sm">
              <thead className="border-b border-neutral-200 bg-neutral-50 text-left text-neutral-600">
                <tr>
                  <th className="p-4 font-semibold whitespace-nowrap">게스트</th>
                  <th className="p-4 font-semibold whitespace-nowrap">숙소</th>
                  <th className="p-4 font-semibold whitespace-nowrap">체크인 / 체크아웃</th>
                  <th className="p-4 font-semibold whitespace-nowrap">금액</th>
                  <th className="p-4 font-semibold whitespace-nowrap">상태</th>
                </tr>
              </thead>
              <tbody>
                {items.map((row) => (
                  <tr key={row.id} className="border-b border-neutral-100 last:border-0">
                    <td className="p-4">
                      <div className="font-medium text-neutral-900">{row.guestName ?? "게스트"}</div>
                      <div className="text-xs text-neutral-500 truncate max-w-[160px]">{row.guestEmail}</div>
                    </td>
                    <td className="p-4">
                      <div className="truncate max-w-[180px]">{row.listing.title}</div>
                      <div className="text-xs text-neutral-500">호스트: {row.host.name ?? row.host.id}</div>
                    </td>
                    <td className="p-4 text-neutral-700 whitespace-nowrap">
                      {new Date(row.checkIn).toLocaleDateString("ko-KR")} ~ {new Date(row.checkOut).toLocaleDateString("ko-KR")}
                    </td>
                    <td className="p-4 whitespace-nowrap">₩{row.totalKrw.toLocaleString()}</td>
                    <td className="p-4">
                      <span className={`whitespace-nowrap inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                        row.status === "CONFIRMED" ? "bg-green-100 text-green-700" :
                        row.status === "CANCELLED" ? "bg-red-100 text-red-700" :
                        "bg-amber-100 text-amber-700"
                      }`}>
                        {getStatusLabel(row)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="grid gap-3 md:hidden">
            {items.map((row) => (
              <div key={row.id} className="rounded-2xl border border-neutral-200 bg-white p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="font-semibold text-neutral-900 truncate">{row.listing.title}</div>
                    <div className="mt-0.5 text-xs text-neutral-500 whitespace-nowrap">게스트: {row.guestName ?? "—"} · 호스트: {row.host.name ?? "—"}</div>
                    <div className="mt-0.5 text-xs text-neutral-400 truncate">{row.guestEmail}</div>
                  </div>
                  <span className={`shrink-0 whitespace-nowrap inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                    row.status === "CONFIRMED" ? "bg-green-100 text-green-700" :
                    row.status === "CANCELLED" ? "bg-red-100 text-red-700" :
                    "bg-amber-100 text-amber-700"
                  }`}>
                    {getStatusLabel(row)}
                  </span>
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-neutral-700">
                  <span className="whitespace-nowrap">{new Date(row.checkIn).toLocaleDateString("ko-KR")} ~ {new Date(row.checkOut).toLocaleDateString("ko-KR")}</span>
                  <span className="whitespace-nowrap font-semibold">₩{row.totalKrw.toLocaleString()}</span>
                </div>
                {row.status === "CANCELLED" && (
                  <div className="text-xs text-neutral-500">취소: {formatCancelledAt(row.updatedAt)}</div>
                )}
              </div>
            ))}
          </div>
        </>
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
