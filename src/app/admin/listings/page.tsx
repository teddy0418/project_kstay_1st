"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { apiClient, ApiClientError } from "@/lib/api/client";

type AdminListing = {
  id: string;
  title: string;
  city: string;
  area: string;
  address: string;
  basePriceKrw: number;
  status: string;
  approvedAt: string | null;
  createdAt: string;
  host: { id: string; name: string | null };
};

const STATUS_OPTIONS = [
  { value: "", label: "전체" },
  { value: "PENDING", label: "승인 대기" },
  { value: "APPROVED", label: "승인됨" },
  { value: "REJECTED", label: "거절됨" },
  { value: "DRAFT", label: "초안" },
];

const STATUS_LABEL: Record<string, string> = {
  DRAFT: "초안",
  PENDING: "승인 대기",
  APPROVED: "승인됨",
  REJECTED: "거절됨",
};

export default function AdminListingsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const statusParam = searchParams.get("status") ?? "";
  const [status, setStatus] = useState(statusParam);
  const [items, setItems] = useState<AdminListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const url = status ? `/api/admin/listings?status=${encodeURIComponent(status)}` : "/api/admin/listings";
      const rows = await apiClient.get<AdminListing[]>(url);
      setItems(Array.isArray(rows) ? rows : []);
    } catch (err) {
      if (err instanceof ApiClientError && (err.status === 401 || err.status === 403)) {
        router.replace("/");
        return;
      }
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [status, router]);

  useEffect(() => {
    void load();
  }, [load]);

  const setStatusAndReplace = (v: string) => {
    setStatus(v);
    const q = v ? `?status=${encodeURIComponent(v)}` : "";
    router.replace(`/admin/listings${q}`);
  };

  const approve = async (id: string) => {
    setActing(id);
    try {
      await apiClient.post(`/api/admin/approvals/${id}/approve`);
      setItems((prev) => prev.filter((x) => x.id !== id));
    } finally {
      setActing(null);
    }
  };

  const reject = async (id: string) => {
    setActing(id);
    try {
      await apiClient.post(`/api/admin/approvals/${id}/reject`);
      setItems((prev) => prev.filter((x) => x.id !== id));
    } finally {
      setActing(null);
    }
  };

  return (
    <div className="grid gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">숙소 관리</h1>
          <p className="mt-1 text-sm text-neutral-500">전체 숙소 목록입니다. 상태별로 필터하고 승인 대기 건은 승인/거절할 수 있습니다.</p>
        </div>
        <div>
          <label className="sr-only" htmlFor="admin-listings-status">상태 필터</label>
          <select
            id="admin-listings-status"
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
        <div className="rounded-2xl border border-neutral-200 bg-white p-8 text-center text-neutral-500">해당하는 숙소가 없습니다.</div>
      ) : (
        <div className="w-full min-w-0 overflow-x-auto rounded-2xl border border-neutral-200 bg-white">
          <table className="w-full min-w-[720px] text-sm">
            <thead className="border-b border-neutral-200 bg-neutral-50 text-left text-neutral-600">
              <tr>
                <th className="p-4 font-semibold">숙소</th>
                <th className="p-4 font-semibold">호스트</th>
                <th className="p-4 font-semibold">가격</th>
                <th className="p-4 font-semibold">상태</th>
                <th className="p-4 font-semibold">등록일</th>
                <th className="p-4 font-semibold">액션</th>
              </tr>
            </thead>
            <tbody>
              {items.map((row) => (
                <tr key={row.id} className="border-b border-neutral-100 last:border-0">
                  <td className="p-4">
                    <div className="font-semibold text-neutral-900 truncate max-w-[200px]">{row.title}</div>
                    <div className="text-xs text-neutral-500 truncate max-w-[200px]">{row.city} · {row.area}</div>
                  </td>
                  <td className="p-4 text-neutral-700">{row.host.name ?? row.host.id}</td>
                  <td className="p-4">₩{row.basePriceKrw.toLocaleString()}</td>
                  <td className="p-4">
                    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                      row.status === "APPROVED" ? "bg-green-100 text-green-700" :
                      row.status === "PENDING" ? "bg-amber-100 text-amber-700" :
                      row.status === "REJECTED" ? "bg-red-100 text-red-700" :
                      "bg-neutral-100 text-neutral-700"
                    }`}>
                      {STATUS_LABEL[row.status] ?? row.status}
                    </span>
                  </td>
                  <td className="p-4 text-neutral-600">
                    {new Date(row.createdAt).toLocaleDateString("ko-KR")}
                  </td>
                  <td className="p-4">
                    {row.status === "PENDING" && (
                      <div className="flex gap-2">
                        <button
                          type="button"
                          disabled={acting !== null}
                          onClick={() => void approve(row.id)}
                          className="rounded-lg bg-neutral-900 px-3 py-1.5 text-xs font-semibold text-white hover:opacity-90 disabled:opacity-50"
                        >
                          {acting === row.id ? "처리 중" : "승인"}
                        </button>
                        <button
                          type="button"
                          disabled={acting !== null}
                          onClick={() => void reject(row.id)}
                          className="rounded-lg border border-red-300 bg-white px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50"
                        >
                          거절
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
