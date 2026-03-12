"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { apiClient, ApiClientError } from "@/lib/api/client";

type AdminPromotionRow = {
  id: string;
  listing: { id: string; title: string };
  placement: "HOME_RECOMMENDED" | "HOME_HANOK" | "HOME_KSTAY_BLACK";
  status: "PENDING" | "ACTIVE" | "ENDED" | "CANCELLED";
  priority: number;
  startAt: string;
  endAt: string;
  amountKrw: number | null;
  currency: string | null;
  memo: string | null;
  createdAt: string;
};

const STATUS_OPTIONS: { value: "" | AdminPromotionRow["status"]; label: string }[] = [
  { value: "", label: "전체 상태" },
  { value: "ACTIVE", label: "진행 중" },
  { value: "PENDING", label: "대기" },
  { value: "ENDED", label: "종료" },
  { value: "CANCELLED", label: "취소" },
];

const PLACEMENT_OPTIONS: { value: "" | AdminPromotionRow["placement"]; label: string }[] = [
  { value: "", label: "전체 위치" },
  { value: "HOME_RECOMMENDED", label: "홈 인기 숙소" },
  { value: "HOME_HANOK", label: "홈 인기 한옥" },
  { value: "HOME_KSTAY_BLACK", label: "KSTAY Black 섹션" },
];

function getPlacementLabel(p: AdminPromotionRow["placement"]): string {
  if (p === "HOME_RECOMMENDED") return "홈 인기 숙소";
  if (p === "HOME_HANOK") return "홈 인기 한옥";
  return "KSTAY Black 섹션";
}

function getStatusLabel(s: AdminPromotionRow["status"]): string {
  if (s === "ACTIVE") return "진행 중";
  if (s === "PENDING") return "대기";
  if (s === "ENDED") return "종료";
  if (s === "CANCELLED") return "취소";
  return s;
}

export default function AdminPromotionsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const statusParam = searchParams.get("status") ?? "";
  const placementParam = searchParams.get("placement") ?? "";
  const pageParam = searchParams.get("page") ?? "1";

  const [status, setStatus] = useState(statusParam);
  const [placement, setPlacement] = useState(placementParam);
  const [page, setPage] = useState(Math.max(1, parseInt(pageParam, 10) || 1));
  const [items, setItems] = useState<AdminPromotionRow[]>([]);
  const [total, setTotal] = useState(0);
  const PAGE_SIZE = 20;
  const [loading, setLoading] = useState(true);
  const [actingId, setActingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (status) params.set("status", status);
      if (placement) params.set("placement", placement);
      params.set("page", String(page));
      params.set("pageSize", String(PAGE_SIZE));
      const res = await apiClient.get<{
        items: AdminPromotionRow[];
        total: number;
        page: number;
        pageSize: number;
      }>(`/api/admin/promotions?${params}`);
      setItems(Array.isArray(res?.items) ? res.items : []);
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
  }, [status, placement, page, router]);

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
    if (placement) params.set("placement", placement);
    params.set("page", "1");
    router.replace(`/admin/promotions?${params}`);
  };

  const setPlacementAndReplace = (v: string) => {
    setPlacement(v);
    setPage(1);
    const params = new URLSearchParams();
    if (status) params.set("status", status);
    if (v) params.set("placement", v);
    params.set("page", "1");
    router.replace(`/admin/promotions?${params}`);
  };

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const goToPage = (p: number) => {
    const next = Math.max(1, Math.min(p, totalPages));
    setPage(next);
    const params = new URLSearchParams();
    if (status) params.set("status", status);
    if (placement) params.set("placement", placement);
    if (next > 1) params.set("page", String(next));
    router.replace(`/admin/promotions${params.toString() ? `?${params}` : ""}`);
  };

  const endPromotion = async (id: string) => {
    setActingId(id);
    try {
      await apiClient.patch<AdminPromotionRow>(`/api/admin/promotions/${id}`, { status: "ENDED" });
      setItems((prev) => prev.map((p) => (p.id === id ? { ...p, status: "ENDED" } : p)));
    } finally {
      setActingId(null);
    }
  };

  return (
    <div className="grid gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">광고 관리</h1>
          <p className="mt-1 text-sm text-neutral-500">
            홈 인기 섹션 및 KSTAY Black 영역의 상위 노출 광고를 한눈에 관리합니다.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <label className="sr-only" htmlFor="admin-promotions-status">
            상태 필터
          </label>
          <select
            id="admin-promotions-status"
            value={status}
            onChange={(e) => setStatusAndReplace(e.target.value)}
            className="rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-sm font-medium text-neutral-800"
          >
            {STATUS_OPTIONS.map((o) => (
              <option key={o.value || "all"} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>

          <label className="sr-only" htmlFor="admin-promotions-placement">
            위치 필터
          </label>
          <select
            id="admin-promotions-placement"
            value={placement}
            onChange={(e) => setPlacementAndReplace(e.target.value)}
            className="rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-sm font-medium text-neutral-800"
          >
            {PLACEMENT_OPTIONS.map((o) => (
              <option key={o.value || "all"} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="rounded-2xl border border-neutral-200 bg-white p-8 text-center text-neutral-500">
          불러오는 중...
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-2xl border border-neutral-200 bg-white p-8 text-center text-neutral-500">
          해당하는 광고가 없습니다.
        </div>
      ) : (
        <div className="w-full min-w-0 overflow-x-auto rounded-2xl border border-neutral-200 bg-white">
          <table className="w-full min-w-[880px] text-sm">
            <thead className="border-b border-neutral-200 bg-neutral-50 text-left text-neutral-600">
              <tr>
                <th className="p-4 font-semibold">숙소</th>
                <th className="p-4 font-semibold">노출 위치</th>
                <th className="p-4 font-semibold">기간</th>
                <th className="p-4 font-semibold">우선순위</th>
                <th className="p-4 font-semibold">금액</th>
                <th className="p-4 font-semibold">상태</th>
                <th className="p-4 font-semibold">생성일</th>
                <th className="p-4 font-semibold">액션</th>
              </tr>
            </thead>
            <tbody>
              {items.map((row) => (
                <tr key={row.id} className="border-b border-neutral-100 last:border-0">
                  <td className="p-4">
                    <div className="font-semibold text-neutral-900 truncate max-w-[220px]">
                      {row.listing.title}
                    </div>
                    <div className="text-[11px] text-neutral-500 font-mono truncate max-w-[220px]">
                      {row.listing.id}
                    </div>
                  </td>
                  <td className="p-4 text-neutral-700">{getPlacementLabel(row.placement)}</td>
                  <td className="p-4 text-neutral-700">
                    <div className="text-xs">
                      {new Date(row.startAt).toLocaleString("ko-KR")}{" "}
                      <span className="text-neutral-400">~</span>
                    </div>
                    <div className="text-xs">
                      {new Date(row.endAt).toLocaleString("ko-KR")}
                    </div>
                  </td>
                  <td className="p-4 text-neutral-700">#{row.priority}</td>
                  <td className="p-4 text-neutral-800">
                    {row.amountKrw != null ? `₩${row.amountKrw.toLocaleString()}` : "—"}
                  </td>
                  <td className="p-4">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                        row.status === "ACTIVE"
                          ? "bg-green-100 text-green-700"
                          : row.status === "PENDING"
                          ? "bg-amber-100 text-amber-700"
                          : row.status === "ENDED"
                          ? "bg-neutral-100 text-neutral-600"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {getStatusLabel(row.status)}
                    </span>
                  </td>
                  <td className="p-4 text-xs text-neutral-600">
                    {new Date(row.createdAt).toLocaleString("ko-KR")}
                  </td>
                  <td className="p-4">
                    <div className="flex flex-col gap-2">
                      <button
                        type="button"
                        disabled={row.status !== "ACTIVE" || actingId === row.id}
                        onClick={() => void endPromotion(row.id)}
                        className="rounded-lg border border-neutral-200 bg-white px-3 py-1.5 text-xs font-semibold text-neutral-800 hover:bg-neutral-50 disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        {actingId === row.id ? "처리 중..." : "조기 종료"}
                      </button>
                    </div>
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

