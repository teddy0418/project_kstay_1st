"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { apiClient, ApiClientError } from "@/lib/api/client";

type HostAnnouncementItem = {
  id: string;
  type: string;
  title: string;
  body: string | null;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
};

const TYPES = ["공지", "팁", "가이드"] as const;

export default function AdminHostAnnouncementsEditPage() {
  const router = useRouter();
  const params = useParams();
  const id = typeof params?.id === "string" ? params.id : "";
  const [type, setType] = useState<string>("공지");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [sortOrder, setSortOrder] = useState(0);
  const [loading, setLoading] = useState(!!id);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError("");
    try {
      const item = await apiClient.get<HostAnnouncementItem>(`/api/admin/host-announcements/${id}`);
      setType(item.type || "공지");
      setTitle(item.title ?? "");
      setBody(item.body ?? "");
      setSortOrder(item.sortOrder ?? 0);
    } catch (err) {
      if (err instanceof ApiClientError && (err.status === 401 || err.status === 403)) {
        router.replace("/");
        return;
      }
      if (err instanceof ApiClientError && err.status === 404) {
        setError("공지를 찾을 수 없습니다.");
        return;
      }
      setError("불러오기에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  }, [id, router]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    setError("");
    setSubmitting(true);
    try {
      await apiClient.put(`/api/admin/host-announcements/${id}`, {
        type: type.trim(),
        title: title.trim(),
        body: body.trim() || null,
        sortOrder,
      });
      router.push("/admin/host-announcements");
      router.refresh();
    } catch (err) {
      if (err instanceof ApiClientError) setError(err.message);
      else setError("저장에 실패했습니다.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="rounded-2xl border border-neutral-200 bg-white p-8 text-center text-neutral-500">
        불러오는 중...
      </div>
    );
  }

  return (
    <div className="grid gap-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/host-announcements" className="text-sm font-medium text-neutral-600 hover:text-neutral-900">
          ← 목록
        </Link>
        <h1 className="text-2xl font-extrabold tracking-tight">호스트 공지 수정</h1>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-6 rounded-2xl border border-neutral-200 bg-white p-6">
        {error && (
          <div className="rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-800">{error}</div>
        )}
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="type" className="block text-sm font-semibold text-neutral-700">유형</label>
            <select
              id="type"
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="mt-1 w-full rounded-xl border border-neutral-200 px-4 py-2.5 text-sm"
              required
            >
              {TYPES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="sortOrder" className="block text-sm font-semibold text-neutral-700">노출 순서</label>
            <input
              id="sortOrder"
              type="number"
              value={sortOrder}
              onChange={(e) => setSortOrder(Number(e.target.value) || 0)}
              className="mt-1 w-full rounded-xl border border-neutral-200 px-4 py-2.5 text-sm"
            />
          </div>
        </div>
        <div>
          <label htmlFor="title" className="block text-sm font-semibold text-neutral-700">제목 (필수)</label>
          <input
            id="title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="mt-1 w-full rounded-xl border border-neutral-200 px-4 py-2.5 text-sm"
            required
          />
        </div>
        <div>
          <label htmlFor="body" className="block text-sm font-semibold text-neutral-700">본문 (선택)</label>
          <textarea
            id="body"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={6}
            className="mt-1 w-full rounded-xl border border-neutral-200 px-4 py-2.5 text-sm"
          />
        </div>
        <div className="flex gap-3">
          <button
            type="submit"
            disabled={submitting}
            className="rounded-xl bg-neutral-900 px-5 py-2.5 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
          >
            {submitting ? "저장 중..." : "저장"}
          </button>
          <Link
            href="/admin/host-announcements"
            className="rounded-xl border border-neutral-200 bg-white px-5 py-2.5 text-sm font-semibold text-neutral-700 hover:bg-neutral-50"
          >
            취소
          </Link>
        </div>
      </form>
    </div>
  );
}
