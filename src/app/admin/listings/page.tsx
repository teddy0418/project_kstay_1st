"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { apiClient, ApiClientError } from "@/lib/api/client";
import { useToast } from "@/components/ui/ToastProvider";

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
  propertyType: string | null;
  host: { id: string; name: string | null };
};

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
  const { toast } = useToast();
  const statusParam = searchParams.get("status") ?? "";
  const [status, setStatus] = useState(statusParam);
  const [items, setItems] = useState<AdminListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState<string | null>(null);
  const [promoTarget, setPromoTarget] = useState<{ listingId: string; title: string } | null>(null);
  const [promoLoading, setPromoLoading] = useState(false);
  const [promoSaving, setPromoSaving] = useState(false);
  const [promotionId, setPromotionId] = useState<string | null>(null);
  const [placement, setPlacement] = useState<AdminPromotionRow["placement"]>("HOME_RECOMMENDED");
  const [startAt, setStartAt] = useState("");
  const [endAt, setEndAt] = useState("");
  const [priority, setPriority] = useState<string>("0");
  const [amountKrw, setAmountKrw] = useState<string>("");
  const [memo, setMemo] = useState("");

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

  const resetPromotionForm = () => {
    setPromotionId(null);
    setPlacement("HOME_RECOMMENDED");
    setStartAt("");
    setEndAt("");
    setPriority("0");
    setAmountKrw("");
    setMemo("");
  };

  const openPromotionModal = async (listing: AdminListing) => {
    setPromoTarget({ listingId: listing.id, title: listing.title });
    resetPromotionForm();
    setPromoLoading(true);
    try {
      const res = await apiClient.get<{ promotion: AdminPromotionRow | null }>(
        `/api/admin/promotions/by-listing?listingId=${encodeURIComponent(listing.id)}`
      );
      const p = res?.promotion ?? null;
      const now = new Date();
      const toLocalInput = (d: Date) => {
        const pad = (n: number) => String(n).padStart(2, "0");
        const year = d.getFullYear();
        const month = pad(d.getMonth() + 1);
        const day = pad(d.getDate());
        return `${year}-${month}-${day}`;
      };

      if (p) {
        setPromotionId(p.id);
        setPlacement(p.placement);
        setStartAt(toLocalInput(new Date(p.startAt)));
        setEndAt(toLocalInput(new Date(p.endAt)));
        setPriority(String(p.priority ?? 0));
        setAmountKrw(p.amountKrw != null ? String(p.amountKrw) : "");
        setMemo(p.memo ?? "");
      } else {
        const defaultPlacement =
          listing.propertyType === "hanok" ? "HOME_HANOK" : "HOME_RECOMMENDED";
        setPlacement(defaultPlacement);
        const start = new Date(now);
        const end = new Date(now);
        end.setDate(end.getDate() + 30);
        setStartAt(toLocalInput(start));
        setEndAt(toLocalInput(end));
        setPriority("0");
        setAmountKrw("");
        setMemo("");
      }
    } catch (err) {
      if (err instanceof ApiClientError && (err.status === 401 || err.status === 403)) {
        router.replace("/");
        return;
      }
      toast("상위 노출 정보를 불러오지 못했습니다.");
    } finally {
      setPromoLoading(false);
    }
  };

  const closePromotionModal = () => {
    setPromoTarget(null);
    resetPromotionForm();
    setPromoLoading(false);
    setPromoSaving(false);
  };

  const handleSavePromotion = async () => {
    if (!promoTarget) return;
    if (!startAt || !endAt || !placement) {
      toast("노출 위치와 시작/종료 일시를 입력해 주세요.");
      return;
    }

    const startDate = new Date(startAt);
    const endDate = new Date(endAt);
    if (!Number.isFinite(startDate.getTime()) || !Number.isFinite(endDate.getTime()) || endDate <= startDate) {
      toast("시작/종료 일시를 다시 확인해 주세요.");
      return;
    }

    const prio = Number(priority);
    const amt = amountKrw ? Number(amountKrw) : 0;
    if ((!Number.isNaN(prio) && prio < 0) || (!Number.isNaN(amt) && amt < 0)) {
      toast("우선순위와 금액은 0 이상이어야 합니다.");
      return;
    }

    if (promoSaving) return;
    setPromoSaving(true);
    try {
      const payload = {
        placement,
        startAt,
        endAt,
        priority: Number.isFinite(prio) ? prio : 0,
        amountKrw: amountKrw ? (Number.isFinite(amt) ? amt : 0) : null,
        memo: memo.trim() || null,
      };

      if (promotionId) {
        await apiClient.patch<AdminPromotionRow>(`/api/admin/promotions/${promotionId}`, payload);
      } else {
        await apiClient.post<AdminPromotionRow>("/api/admin/promotions", {
          listingId: promoTarget.listingId,
          ...payload,
        });
      }

      toast("상위 노출 설정이 저장되었습니다.");
      closePromotionModal();
      void load();
    } catch (err) {
      if (err instanceof ApiClientError && (err.status === 401 || err.status === 403)) {
        router.replace("/");
        return;
      }
      toast("상위 노출 정보를 저장하지 못했습니다. 잠시 후 다시 시도해 주세요.");
    } finally {
      setPromoSaving(false);
    }
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
        <>
          {/* Desktop table */}
          <div className="hidden md:block w-full min-w-0 overflow-x-auto rounded-2xl border border-neutral-200 bg-white">
            <table className="w-full text-sm">
              <thead className="border-b border-neutral-200 bg-neutral-50 text-left text-neutral-600">
                <tr>
                  <th className="p-4 font-semibold whitespace-nowrap">숙소</th>
                  <th className="p-4 font-semibold whitespace-nowrap">호스트</th>
                  <th className="p-4 font-semibold whitespace-nowrap">가격</th>
                  <th className="p-4 font-semibold whitespace-nowrap">상태</th>
                  <th className="p-4 font-semibold whitespace-nowrap">등록일</th>
                  <th className="p-4 font-semibold whitespace-nowrap">액션</th>
                </tr>
              </thead>
              <tbody>
                {items.map((row) => (
                  <tr key={row.id} className="border-b border-neutral-100 last:border-0">
                    <td className="p-4">
                      <Link href={`/admin/listings/${row.id}`} className="font-semibold text-neutral-900 truncate max-w-[200px] hover:underline block">
                        {row.title}
                      </Link>
                      <div className="text-xs text-neutral-500 truncate max-w-[200px]">{row.city} · {row.area}</div>
                      {row.status === "PENDING" && (
                        <Link href={`/admin/listings/${row.id}`} className="mt-1 inline-block whitespace-nowrap text-xs font-medium text-blue-600 hover:underline">
                          검토 (정보·서류 확인)
                        </Link>
                      )}
                    </td>
                    <td className="p-4 text-neutral-700 whitespace-nowrap">{row.host.name ?? row.host.id}</td>
                    <td className="p-4 whitespace-nowrap">₩{row.basePriceKrw.toLocaleString()}</td>
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
                    <td className="p-4 text-neutral-600 whitespace-nowrap">
                      {new Date(row.createdAt).toLocaleDateString("ko-KR")}
                    </td>
                    <td className="p-4">
                      <div className="flex flex-col items-start gap-2">
                        {row.status === "PENDING" && (
                          <div className="flex gap-2">
                            <button type="button" disabled={acting !== null} onClick={() => void approve(row.id)} className="rounded-lg bg-neutral-900 px-3 py-1.5 text-xs font-semibold text-white hover:opacity-90 disabled:opacity-50">
                              {acting === row.id ? "처리 중" : "승인"}
                            </button>
                            <button type="button" disabled={acting !== null} onClick={() => void reject(row.id)} className="rounded-lg border border-red-300 bg-white px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50">
                              거절
                            </button>
                          </div>
                        )}
                        <button type="button" onClick={() => void openPromotionModal(row)} className="whitespace-nowrap rounded-xl border border-neutral-200 bg-white px-3 py-1.5 text-xs font-semibold text-neutral-700 hover:bg-neutral-50">
                          상위 노출 설정
                        </button>
                      </div>
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
                    <Link href={`/admin/listings/${row.id}`} className="font-semibold text-neutral-900 truncate block hover:underline">
                      {row.title}
                    </Link>
                    <div className="mt-0.5 text-xs text-neutral-500">{row.city} · {row.area}</div>
                  </div>
                  <span className={`shrink-0 inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                    row.status === "APPROVED" ? "bg-green-100 text-green-700" :
                    row.status === "PENDING" ? "bg-amber-100 text-amber-700" :
                    row.status === "REJECTED" ? "bg-red-100 text-red-700" :
                    "bg-neutral-100 text-neutral-700"
                  }`}>
                    {STATUS_LABEL[row.status] ?? row.status}
                  </span>
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-neutral-700">
                  <span className="whitespace-nowrap">호스트: {row.host.name ?? row.host.id}</span>
                  <span className="whitespace-nowrap font-semibold">₩{row.basePriceKrw.toLocaleString()}</span>
                  <span className="whitespace-nowrap text-xs text-neutral-500">{new Date(row.createdAt).toLocaleDateString("ko-KR")}</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {row.status === "PENDING" && (
                    <>
                      <button type="button" disabled={acting !== null} onClick={() => void approve(row.id)} className="rounded-lg bg-neutral-900 px-3 py-1.5 text-xs font-semibold text-white hover:opacity-90 disabled:opacity-50">
                        {acting === row.id ? "처리 중" : "승인"}
                      </button>
                      <button type="button" disabled={acting !== null} onClick={() => void reject(row.id)} className="rounded-lg border border-red-300 bg-white px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50">
                        거절
                      </button>
                    </>
                  )}
                  <button type="button" onClick={() => void openPromotionModal(row)} className="rounded-xl border border-neutral-200 bg-white px-3 py-1.5 text-xs font-semibold text-neutral-700 hover:bg-neutral-50">
                    상위 노출
                  </button>
                  {row.status === "PENDING" && (
                    <Link href={`/admin/listings/${row.id}`} className="text-xs font-medium text-blue-600 hover:underline self-center">
                      검토
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
      {promoTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-bold text-neutral-900">상위 노출 설정</h2>
                <p className="mt-1 text-xs text-neutral-500 truncate max-w-xs">
                  {promoTarget.title}
                </p>
              </div>
              <button
                type="button"
                onClick={closePromotionModal}
                className="text-xs text-neutral-500 hover:text-neutral-900"
              >
                닫기
              </button>
            </div>

            <div className="space-y-4 text-sm">
              <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-3">
                <p className="mb-1 text-xs font-semibold text-neutral-700">현재 광고 상태</p>
                {promoLoading ? (
                  <p className="text-xs text-neutral-500">불러오는 중...</p>
                ) : promotionId ? (
                  <p className="text-xs text-neutral-600">
                    기존 광고를 수정 중입니다. 기간/우선순위를 변경해 저장하면 바로 반영됩니다.
                  </p>
                ) : (
                  <p className="text-xs text-neutral-500">
                    등록된 광고가 없습니다. 아래에서 신규로 등록하세요.
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1">
                  노출 위치 (섹션)
                </label>
                <select
                  className="w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-800"
                  value={placement}
                  onChange={(e) => setPlacement(e.target.value as AdminPromotionRow["placement"])}
                >
                  <option value="HOME_RECOMMENDED">홈 인기 숙소</option>
                  <option value="HOME_HANOK">홈 인기 한옥</option>
                  <option value="HOME_KSTAY_BLACK">KSTAY Black 섹션</option>
                </select>
                <p className="mt-1 text-[11px] text-neutral-400">
                  섹션별로 별도 광고로 저장됩니다.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-neutral-700 mb-1">
                    시작 날짜
                  </label>
                  <input
                    type="date"
                    className="w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-800"
                    value={startAt}
                    onChange={(e) => setStartAt(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-neutral-700 mb-1">
                    종료 날짜
                  </label>
                  <input
                    type="date"
                    className="w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-800"
                    value={endAt}
                    onChange={(e) => setEndAt(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-neutral-700 mb-1">
                    우선순위
                  </label>
                  <input
                    type="number"
                    className="w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-800"
                    placeholder="0"
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-neutral-700 mb-1">
                    광고 금액 (KRW)
                  </label>
                  <input
                    type="number"
                    className="w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-800"
                    placeholder="예: 300000"
                    value={amountKrw}
                    onChange={(e) => setAmountKrw(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1">
                  메모
                </label>
                <textarea
                  className="w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-800 resize-none"
                  rows={3}
                  placeholder="계약 메모, 채널(인바운드/영업) 등"
                  value={memo}
                  onChange={(e) => setMemo(e.target.value)}
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={closePromotionModal}
                className="rounded-xl border border-neutral-200 px-4 py-2 text-xs font-semibold text-neutral-700 hover:bg-neutral-50"
              >
                닫기
              </button>
              <button
                type="button"
                disabled={promoSaving}
                onClick={() => void handleSavePromotion()}
                className="rounded-xl bg-neutral-900 px-4 py-2 text-xs font-semibold text-white hover:opacity-90 disabled:opacity-50"
              >
                {promoSaving ? "저장 중..." : "저장"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
