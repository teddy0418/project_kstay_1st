"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiClient, ApiClientError } from "@/lib/api/client";
import { useI18n } from "@/components/ui/LanguageProvider";

type ApprovalRow = {
  id: string;
  title: string;
  city: string;
  area: string;
  address: string;
  basePriceKrw: number;
  host: {
    id: string;
    name: string | null;
    role: "GUEST" | "HOST" | "ADMIN";
  };
};

export default function AdminApprovalsPage() {
  const { lang } = useI18n();
  const c =
    lang === "ko"
      ? {
          title: "호스트 숙소 승인",
          desc: "호스트가 제출한 승인 대기 숙소입니다.",
          loading: "불러오는 중...",
          empty: "대기 중인 숙소가 없습니다.",
          host: "호스트",
          approve: "승인",
        }
      : lang === "ja"
        ? {
            title: "ホスト宿泊先の承認",
            desc: "ホストが提出した承認待ち宿泊先です。",
            loading: "読み込み中...",
            empty: "承認待ちの宿泊先はありません。",
            host: "ホスト",
            approve: "承認",
          }
        : lang === "zh"
          ? {
              title: "房东房源审核",
              desc: "以下为房东提交的待审核房源。",
              loading: "加载中...",
              empty: "暂无待审核房源。",
              host: "房东",
              approve: "通过",
            }
          : {
              title: "Host Listing Approvals",
              desc: "Pending listings submitted by hosts.",
              loading: "Loading...",
              empty: "No pending listings.",
              host: "host",
              approve: "Approve",
            };
  const router = useRouter();
  const [items, setItems] = useState<ApprovalRow[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const rows = await apiClient.get<ApprovalRow[]>("/api/admin/approvals");
      setItems(rows);
    } catch (err) {
      if (err instanceof ApiClientError && (err.status === 401 || err.status === 403)) {
        router.replace("/coming-soon");
        return;
      }
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    void load();
  }, [load]);

  const approve = async (id: string) => {
    try {
      await apiClient.post<{ id: string; status: string }>(`/api/admin/approvals/${id}/approve`);
      setItems((prev) => prev.filter((x) => x.id !== id));
    } catch {}
  };

  return (
    <div className="grid gap-6">
      <div className="rounded-2xl border border-neutral-200 bg-white p-6">
        <div className="text-lg font-bold">{c.title}</div>
        <p className="mt-1 text-sm text-neutral-600">{c.desc}</p>
      </div>

      {loading ? (
        <div className="rounded-2xl border border-neutral-200 bg-white p-6 text-sm text-neutral-600">
          {c.loading}
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-2xl border border-neutral-200 bg-white p-6 text-sm text-neutral-600">
          {c.empty}
        </div>
      ) : (
        <div className="grid gap-4">
          {items.map((item) => (
            <div key={item.id} className="rounded-2xl border border-neutral-200 bg-white p-5">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="min-w-0">
                  <div className="text-base font-semibold truncate">{item.title}</div>
                  <div className="mt-1 text-sm text-neutral-600">
                    {item.city} · {item.area} · {item.address}
                  </div>
                  <div className="mt-1 text-xs text-neutral-500">
                    {c.host}: {item.host.name} ({item.host.id}) / ₩{item.basePriceKrw.toLocaleString()}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => void approve(item.id)}
                  className="inline-flex rounded-xl bg-neutral-900 px-4 py-2 text-sm font-semibold text-white hover:opacity-95 transition"
                >
                  {c.approve}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
