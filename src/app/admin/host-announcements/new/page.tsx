"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { apiClient, ApiClientError } from "@/lib/api/client";

const TYPES = ["공지", "팁", "가이드"] as const;

export default function AdminHostAnnouncementsNewPage() {
  const router = useRouter();
  const [type, setType] = useState<string>("공지");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [sortOrder, setSortOrder] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await apiClient.post("/api/admin/host-announcements", {
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

  return (
    <div className="grid gap-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/host-announcements" className="text-sm font-medium text-neutral-600 hover:text-neutral-900">
          ← 목록
        </Link>
        <h1 className="text-2xl font-extrabold tracking-tight">호스트 공지 등록</h1>
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
            <label htmlFor="sortOrder" className="block text-sm font-semibold text-neutral-700">노출 순서 (작을수록 앞)</label>
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
            placeholder="예: 정산 시스템 점검 안내 (화요일 09:00~10:00)"
            required
          />
        </div>
        <div>
          <label htmlFor="body" className="block text-sm font-semibold text-neutral-700">본문 (선택, 상세 페이지에서 표시)</label>
          <textarea
            id="body"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={6}
            className="mt-1 w-full rounded-xl border border-neutral-200 px-4 py-2.5 text-sm"
            placeholder="호스트가 상세 보기 시 읽는 내용"
          />
        </div>
        <div className="flex gap-3">
          <button
            type="submit"
            disabled={submitting}
            className="rounded-xl bg-neutral-900 px-5 py-2.5 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
          >
            {submitting ? "저장 중..." : "등록"}
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
