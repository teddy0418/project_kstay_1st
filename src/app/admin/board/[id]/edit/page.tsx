"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { apiClient, ApiClientError } from "@/lib/api/client";

type Lang = "en" | "ko" | "ja" | "zh";
const LANGS: { key: Lang; label: string }[] = [
  { key: "ko", label: "한국어" },
  { key: "en", label: "English" },
  { key: "ja", label: "日本語" },
  { key: "zh", label: "中文" },
];

const emptyI18n = (): Record<Lang, string> => ({ en: "", ko: "", ja: "", zh: "" });

type BoardPostItem = {
  id: string;
  cover: string;
  title: Record<Lang, string>;
  excerpt: Record<Lang, string>;
  content: Record<Lang, string>;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
};

export default function AdminBoardEditPage() {
  const router = useRouter();
  const params = useParams();
  const id = typeof params?.id === "string" ? params.id : "";
  const [cover, setCover] = useState("");
  const [title, setTitle] = useState(emptyI18n());
  const [excerpt, setExcerpt] = useState(emptyI18n());
  const [content, setContent] = useState(emptyI18n());
  const [sortOrder, setSortOrder] = useState(0);
  const [loading, setLoading] = useState(!!id);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError("");
    try {
      const post = await apiClient.get<BoardPostItem>(`/api/admin/board/${id}`);
      setCover(post.cover ?? "");
      setTitle({ ...emptyI18n(), ...post.title });
      setExcerpt({ ...emptyI18n(), ...post.excerpt });
      setContent({ ...emptyI18n(), ...post.content });
      setSortOrder(post.sortOrder ?? 0);
    } catch (err) {
      if (err instanceof ApiClientError && (err.status === 401 || err.status === 403)) {
        router.replace("/");
        return;
      }
      if (err instanceof ApiClientError && err.status === 404) {
        setError("글을 찾을 수 없습니다.");
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
      await apiClient.put(`/api/admin/board/${id}`, {
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

  const handleDelete = async () => {
    if (!id || !confirm("이 글을 삭제할까요? 되돌릴 수 없습니다.")) return;
    setDeleting(true);
    setError("");
    try {
      await apiClient.delete(`/api/admin/board/${id}`);
      router.push("/admin/board");
      router.refresh();
    } catch (err) {
      if (err instanceof ApiClientError) setError(err.message);
      else setError("삭제에 실패했습니다.");
    } finally {
      setDeleting(false);
    }
  };

  if (!id) {
    return (
      <div className="rounded-2xl border border-neutral-200 bg-white p-8 text-center text-neutral-500">잘못된 경로입니다.</div>
    );
  }

  if (loading) {
    return (
      <div className="rounded-2xl border border-neutral-200 bg-white p-8 text-center text-neutral-500">불러오는 중...</div>
    );
  }

  return (
    <div className="grid gap-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/board" className="text-sm font-medium text-neutral-600 hover:text-neutral-900">
          ← 목록
        </Link>
        <h1 className="text-2xl font-extrabold tracking-tight">게시판 글 편집</h1>
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
        <div className="flex flex-wrap gap-3">
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
          <button
            type="button"
            disabled={deleting}
            onClick={() => void handleDelete()}
            className="rounded-xl border border-red-300 bg-white px-5 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50"
          >
            {deleting ? "삭제 중…" : "삭제"}
          </button>
        </div>
      </form>
    </div>
  );
}
