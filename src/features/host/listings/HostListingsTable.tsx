"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { apiClient } from "@/lib/api/client";
import { useToast } from "@/components/ui/ToastProvider";

type Row = { id: string; title: string | null; status: string; city: string; area: string };

export default function HostListingsTable({ listings }: { listings: Row[] }) {
  const router = useRouter();
  const { toast } = useToast();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const canDelete = (status: string) => status === "DRAFT" || status === "REJECTED";

  async function handleDelete(id: string, status: string) {
    if (!canDelete(status)) return;
    if (!confirm("이 숙소를 삭제할까요? 삭제하면 복구할 수 없습니다.")) return;
    setDeletingId(id);
    try {
      await apiClient.delete<{ deleted: boolean }>(`/api/host/listings/${id}`);
      toast("삭제되었습니다.");
      router.refresh();
    } catch (e: unknown) {
      const msg = e && typeof e === "object" && "message" in e ? String((e as { message: unknown }).message) : "삭제에 실패했습니다.";
      toast(msg);
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <ul className="space-y-3">
      {listings.map((l) => (
        <li
          key={l.id}
          className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-neutral-200 bg-neutral-50/50 px-4 py-3"
        >
          <div className="min-w-0">
            <span className="font-medium text-neutral-900">{l.title || "(제목 없음)"}</span>
            <span className="ml-2 text-sm text-neutral-500">
              {l.city} · {l.area}
            </span>
            <span className="ml-2 rounded-full border border-neutral-200 px-2 py-0.5 text-xs text-neutral-600">
              {l.status}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href={`/host/listings/new/${l.id}/basics`}
              className="rounded-2xl border border-neutral-200 bg-white px-4 py-2 text-sm font-medium text-neutral-900 hover:bg-neutral-50 transition"
            >
              편집
            </Link>
            {canDelete(l.status) ? (
              <button
                type="button"
                onClick={() => void handleDelete(l.id, l.status)}
                disabled={deletingId === l.id}
                className="rounded-2xl border border-red-200 bg-white px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50 transition disabled:opacity-50"
              >
                {deletingId === l.id ? "삭제 중…" : "삭제"}
              </button>
            ) : (
              <span
                className="rounded-2xl border border-neutral-200 bg-neutral-100 px-4 py-2 text-sm text-neutral-500"
                title="검토 중이거나 승인된 숙소는 삭제할 수 없습니다."
              >
                삭제 불가
              </span>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}
