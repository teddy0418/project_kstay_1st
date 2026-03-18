"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
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
  propertyType: string | null;
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
    <div className="grid gap-6">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight">KSTAY Black</h1>
        <p className="mt-1 text-sm text-neutral-500">
          메인 &quot;KSTAY Black&quot; 섹션에 노출할 숙소를 선정·순서 지정합니다. 승인된 숙소만 추가할 수 있습니다.
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
              <>
                {/* Desktop */}
                <div className="hidden md:block w-full min-w-0 rounded-2xl border border-neutral-200 bg-white">
                  <table className="w-full text-sm">
                    <thead className="border-b border-neutral-200 bg-neutral-50 text-left text-neutral-600">
                      <tr>
                        <th className="p-4 font-semibold whitespace-nowrap w-14">순서</th>
                        <th className="p-4 font-semibold whitespace-nowrap">숙소</th>
                        <th className="p-4 font-semibold whitespace-nowrap">지역</th>
                        <th className="p-4 font-semibold whitespace-nowrap w-28">액션</th>
                      </tr>
                    </thead>
                    <tbody>
                      {blackList.map((row) => (
                        <tr key={row.id} className="border-b border-neutral-100 last:border-0">
                          <td className="p-4 font-medium text-neutral-600 whitespace-nowrap">{row.kstayBlackSortOrder + 1}</td>
                          <td className="p-4"><Link href={`/admin/listings/${row.id}`} className="font-semibold text-neutral-900 hover:underline">{row.title}</Link></td>
                          <td className="p-4 text-neutral-600 whitespace-nowrap">{row.city} · {row.area}</td>
                          <td className="p-4">
                            <button type="button" disabled={acting !== null} onClick={() => void removeFromBlack(row.id)} className="whitespace-nowrap rounded-lg border border-red-300 bg-white px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50">
                              {acting === row.id ? "처리 중" : "선정 해제"}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile */}
                <div className="grid gap-3 md:hidden">
                  {blackList.map((row) => (
                    <div key={row.id} className="rounded-2xl border border-neutral-200 bg-white p-4 flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <Link href={`/admin/listings/${row.id}`} className="font-semibold text-neutral-900 truncate block hover:underline">#{row.kstayBlackSortOrder + 1} {row.title}</Link>
                        <div className="text-xs text-neutral-500">{row.city} · {row.area}</div>
                      </div>
                      <button type="button" disabled={acting !== null} onClick={() => void removeFromBlack(row.id)} className="shrink-0 rounded-lg border border-red-300 bg-white px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50">
                        {acting === row.id ? "처리 중" : "해제"}
                      </button>
                    </div>
                  ))}
                </div>
              </>
            )}
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-neutral-800">승인된 숙소 중 선정 가능 ({canAddList.length}개)</h2>
            {canAddList.length === 0 ? (
              <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-6 text-center text-neutral-500">
                선정 가능한 승인 숙소가 없습니다.
              </div>
            ) : (
              <>
                {/* Desktop */}
                <div className="hidden md:block w-full min-w-0 rounded-2xl border border-neutral-200 bg-white">
                  <table className="w-full text-sm">
                    <thead className="border-b border-neutral-200 bg-neutral-50 text-left text-neutral-600">
                      <tr>
                        <th className="p-4 font-semibold whitespace-nowrap">숙소</th>
                        <th className="p-4 font-semibold whitespace-nowrap">호스트</th>
                        <th className="p-4 font-semibold whitespace-nowrap">지역</th>
                        <th className="p-4 font-semibold whitespace-nowrap">가격</th>
                        <th className="p-4 font-semibold whitespace-nowrap w-36">액션</th>
                      </tr>
                    </thead>
                    <tbody>
                      {canAddList.map((row) => (
                        <tr key={row.id} className="border-b border-neutral-100 last:border-0">
                          <td className="p-4">
                            <Link href={`/admin/listings/${row.id}`} className="font-semibold text-neutral-900 hover:underline">
                              {row.title}
                            </Link>
                            {row.propertyType && <div className="text-xs text-neutral-400">{row.propertyType}</div>}
                          </td>
                          <td className="p-4 text-neutral-700 whitespace-nowrap">{row.host.name ?? row.host.id}</td>
                          <td className="p-4 text-neutral-600 whitespace-nowrap">{row.city} · {row.area}</td>
                          <td className="p-4 text-neutral-800 whitespace-nowrap">₩{row.basePriceKrw.toLocaleString()}</td>
                          <td className="p-4">
                            <button type="button" disabled={acting !== null} onClick={() => void addToBlack(row.id)} className="whitespace-nowrap rounded-lg bg-neutral-900 px-3 py-1.5 text-xs font-semibold text-white hover:opacity-90 disabled:opacity-50">
                              {acting === row.id ? "처리 중" : "KSTAY Black 선정"}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile */}
                <div className="grid gap-3 md:hidden">
                  {canAddList.map((row) => (
                    <div key={row.id} className="rounded-2xl border border-neutral-200 bg-white p-4 space-y-2">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <Link href={`/admin/listings/${row.id}`} className="font-semibold text-neutral-900 truncate block hover:underline">
                            {row.title}
                          </Link>
                          <div className="mt-0.5 text-xs text-neutral-500">{row.city} · {row.area}</div>
                        </div>
                        <button type="button" disabled={acting !== null} onClick={() => void addToBlack(row.id)} className="shrink-0 rounded-lg bg-neutral-900 px-3 py-1.5 text-xs font-semibold text-white hover:opacity-90 disabled:opacity-50">
                          {acting === row.id ? "처리 중" : "선정"}
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-neutral-600">
                        <span className="whitespace-nowrap">호스트: {row.host.name ?? row.host.id}</span>
                        <span className="whitespace-nowrap font-semibold text-neutral-800">₩{row.basePriceKrw.toLocaleString()}</span>
                        {row.propertyType && <span className="whitespace-nowrap">{row.propertyType}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </section>
        </>
      )}
    </div>
  );
}
