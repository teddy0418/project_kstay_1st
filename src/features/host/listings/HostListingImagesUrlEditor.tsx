"use client";

import { useMemo, useState } from "react";
import { apiClient } from "@/lib/api/client";

type ListingImage = { id: string; url: string; sortOrder: number };

export default function HostListingImagesUrlEditor({
  listingId,
  images,
  setImages,
  disabled,
  onNeedListing,
}: {
  listingId: string | null;
  images: ListingImage[];
  setImages: (next: ListingImage[]) => void;
  disabled?: boolean;
  onNeedListing?: () => void;
}) {
  const [url, setUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sorted = useMemo(
    () => images.slice().sort((a, b) => a.sortOrder - b.sortOrder),
    [images]
  );

  async function addImage() {
    if (!listingId) {
      onNeedListing?.();
      return;
    }

    const v = url.trim();
    if (!v) return;

    setBusy(true);
    setError(null);

    try {
      const data = await apiClient.post<ListingImage>(`/api/host/listings/${listingId}/images`, { url: v });

      if (!data?.id) throw new Error("이미지 추가 응답에 id가 없습니다.");

      setImages([...sorted, data].sort((a, b) => a.sortOrder - b.sortOrder));
      setUrl("");
    } catch (e: any) {
      setError(e?.message || "이미지 추가 실패");
    } finally {
      setBusy(false);
    }
  }

  async function removeImage(imageId: string) {
    if (!listingId) return;

    setBusy(true);
    setError(null);

    try {
      await apiClient.delete(`/api/host/listings/${listingId}/images/${imageId}`);
      const next = sorted
        .filter((x) => x.id !== imageId)
        .map((x, idx) => ({ ...x, sortOrder: idx }));
      setImages(next);
    } catch (e: any) {
      setError(e?.message || "이미지 삭제 실패");
    } finally {
      setBusy(false);
    }
  }

  async function reorder(nextIds: string[]) {
    if (!listingId) return;

    setBusy(true);
    setError(null);

    try {
      const data = await apiClient.patch<ListingImage[]>(
        `/api/host/listings/${listingId}/images/reorder`,
        { imageIds: nextIds }
      );
      setImages(data.slice().sort((a, b) => a.sortOrder - b.sortOrder));
    } catch (e: any) {
      setError(e?.message || "순서 변경 실패");
    } finally {
      setBusy(false);
    }
  }

  function moveUp(i: number) {
    if (i <= 0) return;
    const next = sorted.slice();
    [next[i - 1], next[i]] = [next[i], next[i - 1]];
    void reorder(next.map((x) => x.id));
  }

  function moveDown(i: number) {
    if (i >= sorted.length - 1) return;
    const next = sorted.slice();
    [next[i], next[i + 1]] = [next[i + 1], next[i]];
    void reorder(next.map((x) => x.id));
  }

  return (
    <div className="rounded-3xl border border-neutral-200 bg-white p-8 shadow-sm">
      <h2 className="text-lg font-semibold">이미지</h2>
      <p className="mt-1 text-sm text-neutral-600">
        지금은 URL로 추가합니다. (추후 파일 업로드는 "업로드 → URL 받기 → 동일 API로 추가"로 확장)
      </p>

      {!listingId && (
        <div className="mt-4 rounded-2xl border border-neutral-200 bg-neutral-50 p-4 text-sm text-neutral-700">
          이미지를 추가하려면 먼저 <b>초안 저장</b>을 해서 listingId를 만들어야 합니다.
        </div>
      )}

      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        <input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          disabled={disabled || busy}
          placeholder="https://example.com/photo.jpg"
          className="w-full rounded-2xl border border-neutral-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900/10 disabled:bg-neutral-50"
        />
        <button
          type="button"
          onClick={() => void addImage()}
          disabled={disabled || busy || !url.trim()}
          className="rounded-2xl bg-neutral-900 px-4 py-3 text-sm font-medium text-white hover:bg-neutral-800 disabled:opacity-50"
        >
          추가
        </button>
      </div>

      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

      <div className="mt-6 space-y-3">
        {sorted.length === 0 ? (
          <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-5 text-sm text-neutral-600">
            등록된 이미지가 없습니다.
          </div>
        ) : (
          sorted.map((img, i) => (
            <div key={img.id} className="flex items-center gap-3 rounded-2xl border border-neutral-200 p-4">
              <img
                src={img.url}
                alt=""
                className="h-16 w-24 rounded-xl object-cover"
                loading="lazy"
              />

              <div className="min-w-0 flex-1">
                <p className="truncate text-sm">{img.url}</p>
                <p className="text-xs text-neutral-500">sortOrder: {img.sortOrder}</p>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => moveUp(i)}
                  disabled={disabled || busy || i === 0}
                  className="rounded-2xl border border-neutral-200 px-3 py-2 text-sm disabled:opacity-50"
                >
                  ↑
                </button>
                <button
                  type="button"
                  onClick={() => moveDown(i)}
                  disabled={disabled || busy || i === sorted.length - 1}
                  className="rounded-2xl border border-neutral-200 px-3 py-2 text-sm disabled:opacity-50"
                >
                  ↓
                </button>
                <button
                  type="button"
                  onClick={() => void removeImage(img.id)}
                  disabled={disabled || busy}
                  className="rounded-2xl border border-neutral-200 px-3 py-2 text-sm disabled:opacity-50"
                >
                  삭제
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
