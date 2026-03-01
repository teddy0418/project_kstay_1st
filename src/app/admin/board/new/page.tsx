"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { apiClient, ApiClientError } from "@/lib/api/client";

type Lang = "en" | "ko" | "ja" | "zh";
const LANGS: { key: Lang; label: string }[] = [
  { key: "ko", label: "한국어" },
  { key: "en", label: "English" },
  { key: "ja", label: "日本語" },
  { key: "zh", label: "中文" },
];

const emptyI18n = (): Record<Lang, string> => ({ en: "", ko: "", ja: "", zh: "" });

export default function AdminBoardNewPage() {
  const router = useRouter();
  const [cover, setCover] = useState("");
  const [title, setTitle] = useState(emptyI18n());
  const [excerpt, setExcerpt] = useState(emptyI18n());
  const [content, setContent] = useState(emptyI18n());
  const [sortOrder, setSortOrder] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await apiClient.post("/api/admin/board", {
        cover: cover.trim(),
        title,
        excerpt,
        content,
        sortOrder,
      });
      router.push("/admin/board");
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
        <Link href="/admin/board" className="text-sm font-medium text-neutral-600 hover:text-neutral-900">
          ← 목록
        </Link>
        <h1 className="text-2xl font-extrabold tracking-tight">게시판 새 글</h1>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-8 rounded-2xl border border-neutral-200 bg-white p-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="cover" className="block text-sm font-semibold text-neutral-700">썸네일 URL</label>
            <input
              id="cover"
              type="url"
              value={cover}
              onChange={(e) => setCover(e.target.value)}
              className="mt-1 w-full rounded-xl border border-neutral-200 px-4 py-2.5 text-sm"
              placeholder="https://..."
              required
            />
          </div>
          <div>
            <label htmlFor="sortOrder" className="block text-sm font-semibold text-neutral-700">노출 순서 (숫자 작을수록 앞)</label>
            <input
              id="sortOrder"
              type="number"
              value={sortOrder}
              onChange={(e) => setSortOrder(Number(e.target.value) || 0)}
              className="mt-1 w-full rounded-xl border border-neutral-200 px-4 py-2.5 text-sm"
            />
          </div>
        </div>

        {LANGS.map(({ key, label }) => (
          <fieldset key={key} className="rounded-xl border border-neutral-100 p-4">
            <legend className="px-2 text-sm font-semibold text-neutral-700">{label}</legend>
            <div className="mt-3 grid gap-3">
              <div>
                <label className="block text-xs text-neutral-500">제목</label>
                <input
                  type="text"
                  value={title[key]}
                  onChange={(e) => setTitle((t) => ({ ...t, [key]: e.target.value }))}
                  className="mt-0.5 w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-neutral-500">요약</label>
                <input
                  type="text"
                  value={excerpt[key]}
                  onChange={(e) => setExcerpt((t) => ({ ...t, [key]: e.target.value }))}
                  className="mt-0.5 w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-neutral-500">본문</label>
                <textarea
                  value={content[key]}
                  onChange={(e) => setContent((t) => ({ ...t, [key]: e.target.value }))}
                  rows={4}
                  className="mt-0.5 w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm"
                />
              </div>
            </div>
          </fieldset>
        ))}

        {error && <p className="text-sm text-red-600">{error}</p>}
        <div className="flex gap-3">
          <button
            type="submit"
            disabled={submitting}
            className="rounded-xl bg-neutral-900 px-5 py-2.5 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
          >
            {submitting ? "저장 중…" : "저장"}
          </button>
          <Link
            href="/admin/board"
            className="rounded-xl border border-neutral-200 bg-white px-5 py-2.5 text-sm font-semibold text-neutral-700 hover:bg-neutral-50"
          >
            취소
          </Link>
        </div>
      </form>
    </div>
  );
}
