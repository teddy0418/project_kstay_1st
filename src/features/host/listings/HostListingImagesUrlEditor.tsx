"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { apiClient } from "@/lib/api/client";
import { ChevronLeft, ChevronRight, ImagePlus, Trash2 } from "lucide-react";

type ListingImage = { id: string; url: string; sortOrder: number };

const MIN_DEFAULT = 1;
const MAX_DEFAULT = 20;

export default function HostListingImagesUrlEditor({
  listingId,
  images,
  setImages,
  disabled,
  onNeedListing,
  minCount = MIN_DEFAULT,
  maxCount = MAX_DEFAULT,
}: {
  listingId: string | null;
  images: ListingImage[];
  setImages: (next: ListingImage[]) => void;
  disabled?: boolean;
  onNeedListing?: () => void;
  minCount?: number;
  maxCount?: number;
}) {
  const [url, setUrl] = useState("");
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dropTargetIndex, setDropTargetIndex] = useState<number | null>(null);
  const [isDropOver, setIsDropOver] = useState(false);

  const sorted = useMemo(
    () => images.slice().sort((a, b) => a.sortOrder - b.sortOrder),
    [images]
  );
  const canAdd = sorted.length < maxCount;
  const safeIndex = sorted.length > 0 ? Math.min(currentIndex, sorted.length - 1) : 0;
  const currentImage = sorted[safeIndex] ?? null;

  useEffect(() => {
    if (sorted.length > 0 && currentIndex >= sorted.length) {
      setCurrentIndex(Math.max(0, sorted.length - 1));
    }
  }, [sorted.length, currentIndex]);

  const addByUrl = useCallback(async () => {
    if (!listingId) {
      onNeedListing?.();
      return;
    }
    const v = url.trim();
    if (!v) return;
    setBusy(true);
    setError(null);
    try {
      const data = await apiClient.post<ListingImage>(`/api/host/listings/${listingId}/images`, {
        url: v,
        sortOrder: sorted.length,
      });
      if (!data?.id) throw new Error("추가 실패");
      setImages([...sorted, data].sort((a, b) => a.sortOrder - b.sortOrder));
      setUrl("");
      setShowUrlInput(false);
      setCurrentIndex(sorted.length);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "이미지 추가에 실패했습니다.");
    } finally {
      setBusy(false);
    }
  }, [listingId, url, sorted, setImages, onNeedListing]);

  const uploadFile = useCallback(
    async (file: File): Promise<string> => {
      if (!listingId) throw new Error("listingId 없음");
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch(`/api/host/listings/${listingId}/images/upload`, {
        method: "POST",
        credentials: "same-origin",
        body: formData,
      });
      const json = (await res.json()) as { data?: { url: string }; error?: { message: string } };
      if (!res.ok) throw new Error(json?.error?.message ?? "업로드 실패");
      if (!json?.data?.url) throw new Error("url 없음");
      return json.data.url;
    },
    [listingId]
  );

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();
      setIsDropOver(false);
      if (!listingId || disabled || busy) return;
      const files = Array.from(e.dataTransfer.files).filter((f) =>
        ["image/jpeg", "image/png", "image/webp", "image/gif"].includes(f.type)
      );
      if (files.length === 0) {
        setError("이미지 파일만 넣어 주세요.");
        return;
      }
      setBusy(true);
      setError(null);
      try {
        let list = sorted.slice();
        for (const file of files) {
          if (list.length >= maxCount) break;
          const imageUrl = await uploadFile(file);
          const data = await apiClient.post<ListingImage>(
            `/api/host/listings/${listingId}/images`,
            { url: imageUrl, sortOrder: list.length }
          );
          if (data?.id) {
            list = [...list, data].sort((a, b) => a.sortOrder - b.sortOrder);
            setImages(list);
          }
        }
        setCurrentIndex(sorted.length);
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : "업로드 실패");
      } finally {
        setBusy(false);
      }
    },
    [listingId, disabled, busy, sorted, maxCount, uploadFile, setImages]
  );

  const removeImage = useCallback(
    async (imageId: string) => {
      if (!listingId) return;
      setBusy(true);
      setError(null);
      try {
        await apiClient.delete(`/api/host/listings/${listingId}/images/${imageId}`);
        const next = sorted.filter((x) => x.id !== imageId).map((x, i) => ({ ...x, sortOrder: i }));
        setImages(next);
        setCurrentIndex((i) => Math.min(i, Math.max(0, next.length - 1)));
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : "삭제 실패");
      } finally {
        setBusy(false);
      }
    },
    [listingId, sorted, setImages]
  );

  const reorder = useCallback(
    async (nextIds: string[]) => {
      if (!listingId) return;
      setBusy(true);
      setError(null);
      try {
        const data = await apiClient.patch<ListingImage[]>(
          `/api/host/listings/${listingId}/images/reorder`,
          { imageIds: nextIds }
        );
        setImages(data.slice().sort((a, b) => a.sortOrder - b.sortOrder));
        const viewedId = sorted[safeIndex]?.id;
        const newIdx = nextIds.indexOf(viewedId ?? "");
        setCurrentIndex(newIdx >= 0 ? newIdx : 0);
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : "순서 변경 실패");
      } finally {
        setBusy(false);
      }
    },
    [listingId, setImages, sorted, safeIndex]
  );

  const onThumbDragStart = (i: number) => setDragIndex(i);
  const onThumbDragEnd = () => {
    setDragIndex(null);
    setDropTargetIndex(null);
  };
  const onThumbDragOver = (e: React.DragEvent, i: number) => {
    e.preventDefault();
    if (dragIndex !== null) setDropTargetIndex(i);
  };
  const onThumbDrop = (e: React.DragEvent, toIndex: number) => {
    e.preventDefault();
    setDropTargetIndex(null);
    if (dragIndex === null || dragIndex === toIndex) {
      setDragIndex(null);
      return;
    }
    const next = sorted.slice();
    const [removed] = next.splice(dragIndex, 1);
    if (removed) {
      next.splice(toIndex, 0, removed);
      void reorder(next.map((x) => x.id));
    }
    setDragIndex(null);
  };

  const goPrev = () => setCurrentIndex((i) => Math.max(0, i - 1));
  const goNext = () => setCurrentIndex((i) => Math.min(sorted.length - 1, i + 1));

  const label = safeIndex === 0 ? "대표이미지" : String(safeIndex + 1);

  if (!listingId) {
    return (
      <div className="rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm text-neutral-600">
        먼저 초안을 저장해 주세요.
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* 추가 영역: 한 줄로 정리 */}
      {canAdd && (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDropOver(true);
          }}
          onDragLeave={() => setIsDropOver(false)}
          onDrop={handleDrop}
          className={`rounded-xl border-2 border-dashed px-4 py-3 transition ${
            isDropOver ? "border-neutral-800 bg-neutral-100" : "border-neutral-200 bg-neutral-50/80"
          } ${disabled || busy ? "pointer-events-none opacity-60" : ""}`}
        >
          <div className="flex flex-wrap items-center gap-3">
            <span className="flex items-center gap-2 text-sm text-neutral-600">
              <ImagePlus className="h-4 w-4" />
              사진을 끌어다 놓거나 (1024×683 이상, 20MB 이하)
            </span>
            {!showUrlInput ? (
              <button
                type="button"
                onClick={() => setShowUrlInput(true)}
                className="text-sm font-medium text-neutral-800 underline underline-offset-2 hover:no-underline"
              >
                URL로 추가
              </button>
            ) : (
              <div className="flex flex-1 min-w-[200px] items-center gap-2">
                <input
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addByUrl()}
                  placeholder="https://..."
                  className="flex-1 rounded-lg border border-neutral-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-400"
                  disabled={busy}
                />
                <button
                  type="button"
                  onClick={() => void addByUrl()}
                  disabled={busy || !url.trim()}
                  className="rounded-lg bg-neutral-800 px-3 py-2 text-sm font-medium text-white disabled:opacity-50"
                >
                  추가
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowUrlInput(false);
                    setUrl("");
                  }}
                  className="text-sm text-neutral-500 hover:text-neutral-700"
                >
                  취소
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {error && (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      )}

      {/* 메인 뷰어 */}
      {sorted.length > 0 && (
        <div className="relative overflow-hidden rounded-xl bg-neutral-100">
          <div className="relative aspect-[4/3] flex items-center justify-center">
            <Image
              src={currentImage?.url ?? ""}
              alt=""
              fill
              className="object-contain"
              loading="lazy"
              unoptimized
            />
            {/* 라벨: 대표이미지 / 2, 3... */}
            <span className="absolute bottom-3 left-3 rounded-md bg-black/60 px-2.5 py-1 text-xs font-medium text-white">
              {label}
            </span>
            {/* 삭제 */}
            {!disabled && !busy && currentImage && (
              <button
                type="button"
                onClick={() => void removeImage(currentImage.id)}
                className="absolute bottom-3 right-3 rounded-md bg-black/60 p-2 text-white hover:bg-red-600"
                aria-label="이 사진 삭제"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
            {/* 이전/다음 */}
            {sorted.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={goPrev}
                  disabled={safeIndex <= 0}
                  className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-white/90 p-2 shadow-sm hover:bg-white disabled:opacity-30"
                  aria-label="이전"
                >
                  <ChevronLeft className="h-5 w-5 text-neutral-800" />
                </button>
                <button
                  type="button"
                  onClick={goNext}
                  disabled={safeIndex >= sorted.length - 1}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-white/90 p-2 shadow-sm hover:bg-white disabled:opacity-30"
                  aria-label="다음"
                >
                  <ChevronRight className="h-5 w-5 text-neutral-800" />
                </button>
              </>
            )}
          </div>
          <p className="py-2 text-center text-xs text-neutral-500">
            {safeIndex + 1} / {sorted.length}
          </p>
        </div>
      )}

      {/* 썸네일: 클릭 선택 + 드래그 순서 */}
      {sorted.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {sorted.map((img, i) => {
            const active = i === safeIndex;
            const isDrop = dropTargetIndex === i;
            const dragging = dragIndex === i;
            return (
              <button
                key={img.id}
                type="button"
                draggable={!disabled && !busy}
                onDragStart={() => onThumbDragStart(i)}
                onDragEnd={onThumbDragEnd}
                onDragOver={(e) => onThumbDragOver(e, i)}
                onDrop={(e) => onThumbDrop(e, i)}
                onClick={() => setCurrentIndex(i)}
                className={`shrink-0 rounded-lg border-2 transition ${
                  active ? "border-neutral-900 ring-2 ring-neutral-400" : "border-transparent hover:border-neutral-300"
                } ${isDrop ? "border-green-500" : ""} ${dragging ? "opacity-50" : ""}`}
              >
                <div className="relative h-16 w-24 overflow-hidden rounded-md bg-neutral-200">
                  <Image
                    src={img.url}
                    alt=""
                    width={96}
                    height={64}
                    className="h-full w-full object-cover"
                    loading="lazy"
                    unoptimized
                  />
                  <span className="absolute bottom-0.5 left-0.5 rounded bg-black/60 px-1.5 py-0.5 text-[10px] font-medium text-white">
                    {i === 0 ? "대표" : i + 1}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* 카운트 */}
      <p className="text-xs text-neutral-500">
        {sorted.length} / {maxCount}장
        {sorted.length < minCount && ` · 최소 ${minCount}장 필요`}
      </p>
    </div>
  );
}
