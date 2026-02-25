"use client";

import { useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useListingWizard } from "@/features/host/listings/ListingWizardContext";
import { useToast } from "@/components/ui/ToastProvider";
import HostListingImagesUrlEditor from "@/features/host/listings/HostListingImagesUrlEditor";

export default function WizardPhotosPage() {
  const { listing, setListing, isLocked, performSaveRef, performSave, saving } = useListingWizard();
  const { toast } = useToast();
  const router = useRouter();

  const setImages = useCallback(
    (next: { id: string; url: string; sortOrder: number }[]) => {
      if (listing) setListing({ ...listing, images: next });
    },
    [listing, setListing]
  );

  useEffect(() => {
    performSaveRef.current = async () => {};
    return () => {
      performSaveRef.current = null;
    };
  }, [performSaveRef]);

  if (!listing) return null;

  return (
    <div className="rounded-3xl border border-neutral-200 bg-white p-8 shadow-sm">
      <h2 className="text-xl font-semibold">사진</h2>
      <p className="mt-1 text-sm text-neutral-500">
        최소 5장, 최대 20장. 첫 사진이 대표이미지입니다. 썸네일 드래그로 순서 변경.
      </p>
      <p className="mt-0.5 text-xs text-neutral-400">
        사진 규격: 1024×683픽셀 이상, 20MB 이하 (JPEG/PNG/WebP/GIF). 가로 사진 권장.
      </p>

      <div className="mt-6">
        <HostListingImagesUrlEditor
          listingId={listing.id}
          images={listing.images}
          setImages={setImages}
          disabled={isLocked}
          onNeedListing={() => {}}
          minCount={5}
          maxCount={20}
        />
      </div>

      <div className="mt-8 flex justify-end gap-3">
        <button
          type="button"
          onClick={() => router.push(`/host/listings/new/${listing.id}/amenities`)}
          className="rounded-2xl border border-neutral-200 px-6 py-3 text-sm font-medium hover:bg-neutral-50"
        >
          이전
        </button>
        <button
          type="button"
          onClick={() => void performSave()}
          disabled={isLocked || saving}
          className="rounded-2xl border border-neutral-200 bg-white px-6 py-3 text-sm font-medium text-neutral-900 hover:bg-neutral-50 disabled:opacity-50"
        >
          {saving ? "저장 중…" : "저장"}
        </button>
        <button
          type="button"
          onClick={() => {
            const count = listing.images?.length ?? 0;
            if (count < 5) {
              toast("사진을 최소 5장 등록해 주세요.");
              return;
            }
            router.push(`/host/listings/new/${listing.id}/guide`);
          }}
          disabled={isLocked || (listing.images?.length ?? 0) < 5}
          className="rounded-2xl bg-neutral-900 px-6 py-3 text-sm font-medium text-white hover:bg-neutral-800 disabled:opacity-50"
        >
          다음: 숙소정보
        </button>
      </div>
      {(listing.images?.length ?? 0) < 5 && (
        <p className="mt-2 text-center text-xs text-neutral-500">최소 5장이 필요합니다.</p>
      )}
    </div>
  );
}
