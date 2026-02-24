"use client";

import { useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useListingWizard } from "@/features/host/listings/ListingWizardContext";
import HostListingImagesUrlEditor from "@/features/host/listings/HostListingImagesUrlEditor";

export default function WizardPhotosPage() {
  const { listing, setListing, isLocked, performSaveRef } = useListingWizard();
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
      <p className="mt-1 text-sm text-neutral-600">최소 1장 이상 등록을 권장합니다. 추가/삭제/순서 변경 시 즉시 저장됩니다.</p>

      <div className="mt-6">
        <HostListingImagesUrlEditor
          listingId={listing.id}
          images={listing.images}
          setImages={setImages}
          disabled={isLocked}
          onNeedListing={() => {}}
        />
      </div>

      <div className="mt-8 flex justify-end">
        <button
          type="button"
          onClick={() => router.push(`/host/listings/new/${listing.id}/review`)}
          disabled={isLocked}
          className="rounded-2xl bg-neutral-900 px-6 py-3 text-sm font-medium text-white hover:bg-neutral-800 disabled:opacity-50"
        >
          다음: 검토 및 승인요청
        </button>
      </div>
    </div>
  );
}
