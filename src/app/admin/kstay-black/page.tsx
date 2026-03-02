"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiClient, ApiClientError } from "@/lib/api/client";

type KstayBlackItem = {
  id: string;
  title: string;
  city: string;
  area: string;
  kstayBlackSortOrder: number;
};

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

export default function AdminKstayBlackPage() {
  const router = useRouter();
  const [blackList, setBlackList] = useState<KstayBlackItem[]>([]);
  const [approvedList, setApprovedList] = useState<AdminListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [black, approved] = await Promise.all([
        apiClient.get<KstayBlackItem[]>("/api/admin/kstay-black"),
        apiClient.get<AdminListing[]>("/api/admin/listings?status=APPROVED"),
      ]);
      setBlackList(Array.isArray(black) ? black : []);
      setApprovedList(Array.isArray(approved) ? approved : []);
    } catch (err) {
      if (err instanceof ApiClientError && (err.status === 401 || err.status === 403)) {
        router.replace("/");
        return;
      }
      setBlackList([]);
      setApprovedList([]);
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    void load();
  }, [load]);

  const addToBlack = async (listingId: string) => {
    setActing(listingId);
    try {
      await apiClient.post("/api/admin/kstay-black", { listingId });
      await load();
    } finally {
      setActing(null);
    }
  };

  const removeFromBlack = async (listingId: string) => {
    setActing(listingId);
    try {
      await apiClient.delete(`/api/admin/kstay-black/${listingId}`);
      setBlackList((prev) => prev.filter((x) => x.id !== listingId));
    } finally {
      setActing(null);
    }
  };

  const blackIds = new Set(blackList.map((x) => x.id));
  const canAddList = approvedList.filter((x) => !blackIds.has(x.id));

  return (
    <div className="grid gap-8">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight">KSTAY Black 선정</h1>
        <p className="mt-1 text-sm text-neutral-500">
          메인 페이지 &quot;KSTAY Black&quot; 섹션에 노출할 숙소를 선정합니다. 승인된 숙소만 선정할 수 있으며, 선정 순서대로 노출됩니다.
        </p>
      </div>

      {loading ? (
        <div className="rounded-2xl border border-neutral-200 bg-white p-8 text-center text-neutral-500">불러오는 중...</div>
      ) : (
        <>
          <section>
            <h2 className="mb-3 text-lg font-semibold text-neutral-800">현재 KSTAY Black 선정 목록 ({blackList.length}개)</h2>
            {blackList.length === 0 ? (
              <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-6 text-center text-neutral-500">
                선정된 숙소가 없습니다. 아래 승인된 숙소에서 &quot;KSTAY Black 선정&quot;으로 추가하세요.
              </div>
            ) : (
              <div className="w-full min-w-0 overflow-x-auto rounded-2xl border border-neutral-200 bg-white">
                <table className="w-full min-w-[480px] text-sm">
                  <thead className="border-b border-neutral-200 bg-neutral-50 text-left text-neutral-600">
                    <tr>
                      <th className="p-4 font-semibold w-14">순서</th>
                      <th className="p-4 font-semibold">숙소</th>
                      <th className="p-4 font-semibold">지역</th>
                      <th className="p-4 font-semibold w-28">액션</th>
                    </tr>
                  </thead>
                  <tbody>
                    {blackList.map((row) => (
                      <tr key={row.id} className="border-b border-neutral-100 last:border-0">
                        <td className="p-4 font-medium text-neutral-600">{row.kstayBlackSortOrder + 1}</td>
                        <td className="p-4 font-semibold text-neutral-900">{row.title}</td>
                        <td className="p-4 text-neutral-600">{row.city} · {row.area}</td>
                        <td className="p-4">
                          <button
                            type="button"
                            disabled={acting !== null}
                            onClick={() => void removeFromBlack(row.id)}
                            className="rounded-lg border border-red-300 bg-white px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50"
                          >
                            {acting === row.id ? "처리 중" : "선정 해제"}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-neutral-800">승인된 숙소 중 선정 가능 ({canAddList.length}개)</h2>
            {canAddList.length === 0 ? (
              <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-6 text-center text-neutral-500">
                선정 가능한 승인 숙소가 없습니다.
              </div>
            ) : (
              <div className="w-full min-w-0 overflow-x-auto rounded-2xl border border-neutral-200 bg-white">
                <table className="w-full min-w-[480px] text-sm">
                  <thead className="border-b border-neutral-200 bg-neutral-50 text-left text-neutral-600">
                    <tr>
                      <th className="p-4 font-semibold">숙소</th>
                      <th className="p-4 font-semibold">지역</th>
                      <th className="p-4 font-semibold w-36">액션</th>
                    </tr>
                  </thead>
                  <tbody>
                    {canAddList.map((row) => (
                      <tr key={row.id} className="border-b border-neutral-100 last:border-0">
                        <td className="p-4 font-semibold text-neutral-900">{row.title}</td>
                        <td className="p-4 text-neutral-600">{row.city} · {row.area}</td>
                        <td className="p-4">
                          <button
                            type="button"
                            disabled={acting !== null}
                            onClick={() => void addToBlack(row.id)}
                            className="rounded-lg bg-neutral-900 px-3 py-1.5 text-xs font-semibold text-white hover:opacity-90 disabled:opacity-50"
                          >
                            {acting === row.id ? "처리 중" : "KSTAY Black 선정"}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
