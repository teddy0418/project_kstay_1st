"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { apiClient, ApiClientError } from "@/lib/api/client";

type Lang = "en" | "ko" | "ja" | "zh";
type BoardPostI18n = Record<Lang, string>;

type BoardPostItem = {
  id: string;
  cover: string;
  title: BoardPostI18n;
  excerpt: BoardPostI18n;
  content: BoardPostI18n;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
};

function pickTitle(title: BoardPostI18n): string {
  return title?.ko || title?.en || title?.ja || title?.zh || "(제목 없음)";
}

export default function AdminBoardPage() {
  const router = useRouter();
  const [items, setItems] = useState<BoardPostItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const rows = await apiClient.get<BoardPostItem[]>("/api/admin/board");
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
  }, [router]);

  useEffect(() => {
    void load();
  }, [load]);

  const deletePost = async (id: string) => {
    if (!confirm("이 글을 삭제할까요?")) return;
    setDeletingId(id);
    try {
      await apiClient.delete(`/api/admin/board/${id}`);
      setItems((prev) => prev.filter((x) => x.id !== id));
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="grid gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">게시판 관리</h1>
          <p className="mt-1 text-sm text-neutral-500">게스트 게시판에 노출되는 글을 등록·수정·삭제합니다.</p>
        </div>
        <Link
          href="/admin/board/new"
          className="inline-flex items-center justify-center rounded-xl bg-neutral-900 px-4 py-2.5 text-sm font-semibold text-white hover:opacity-90"
        >
          새 글 쓰기
        </Link>
      </div>

      {loading ? (
        <div className="rounded-2xl border border-neutral-200 bg-white p-8 text-center text-neutral-500">불러오는 중...</div>
      ) : items.length === 0 ? (
        <div className="rounded-2xl border border-neutral-200 bg-white p-8 text-center text-neutral-500">등록된 글이 없습니다.</div>
      ) : (
        <div className="w-full min-w-0 overflow-x-auto rounded-2xl border border-neutral-200 bg-white">
          <table className="w-full min-w-[640px] text-sm">
            <thead className="border-b border-neutral-200 bg-neutral-50 text-left text-neutral-600">
              <tr>
                <th className="p-4 font-semibold">썸네일</th>
                <th className="p-4 font-semibold">제목</th>
                <th className="p-4 font-semibold">순서</th>
                <th className="p-4 font-semibold">등록일</th>
                <th className="p-4 font-semibold">액션</th>
              </tr>
            </thead>
            <tbody>
              {items.map((row) => (
                <tr key={row.id} className="border-b border-neutral-100 last:border-0">
                  <td className="p-4">
                    {row.cover ? (
                      <img src={row.cover} alt="" className="h-12 w-16 rounded-lg object-cover" />
                    ) : (
                      <span className="text-neutral-400">—</span>
                    )}
                  </td>
                  <td className="p-4">
                    <div className="font-semibold text-neutral-900 truncate max-w-[240px]">{pickTitle(row.title)}</div>
                  </td>
                  <td className="p-4 text-neutral-600">{row.sortOrder}</td>
                  <td className="p-4 text-neutral-600">
                    {new Date(row.createdAt).toLocaleDateString("ko-KR")}
                  </td>
                  <td className="p-4">
                    <div className="flex gap-2">
                      <Link
                        href={`/admin/board/${row.id}/edit`}
                        className="rounded-lg bg-neutral-900 px-3 py-1.5 text-xs font-semibold text-white hover:opacity-90"
                      >
                        편집
                      </Link>
                      <button
                        type="button"
                        disabled={deletingId !== null}
                        onClick={() => void deletePost(row.id)}
                        className="rounded-lg border border-red-300 bg-white px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50"
                      >
                        {deletingId === row.id ? "삭제 중" : "삭제"}
                      </button>
                    </div>
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
