"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useListingWizard } from "@/features/host/listings/ListingWizardContext";
import { useToast } from "@/components/ui/ToastProvider";

export default function WizardGuidePage() {
  const { listing, patch, isLocked, dirty, setDirty, performSaveRef, setSaving } = useListingWizard();
  const { toast } = useToast();
  const router = useRouter();
  const [checkInGuide, setCheckInGuide] = useState("");
  const [houseRules, setHouseRules] = useState("");

  useEffect(() => {
    if (!listing) return;
    setCheckInGuide((listing as { checkInGuideMessage?: string | null }).checkInGuideMessage ?? "");
    setHouseRules((listing as { houseRulesMessage?: string | null }).houseRulesMessage ?? "");
  }, [listing]);

  const save = useCallback(async () => {
    if (!listing || isLocked) return;
    setSaving(true);
    try {
      await patch({ checkInGuideMessage: checkInGuide || null, houseRulesMessage: houseRules || null });
      setDirty(false);
      toast("저장됨");
    } finally {
      setSaving(false);
    }
  }, [listing, isLocked, patch, checkInGuide, houseRules, setDirty, setSaving, toast]);

  useEffect(() => {
    performSaveRef.current = save;
    return () => {
      performSaveRef.current = null;
    };
  }, [performSaveRef, save]);

  const goNext = useCallback(async () => {
    if (!listing) return;
    const target = `/host/listings/new/${listing.id}/photos`;
    if (dirty) {
      setSaving(true);
      try {
        await patch({ checkInGuideMessage: checkInGuide || null, houseRulesMessage: houseRules || null });
        setDirty(false);
        setSaving(false);
        router.push(target);
      } catch {
        toast("저장에 실패했습니다.");
        setSaving(false);
      }
    } else {
      router.push(target);
    }
  }, [listing, dirty, checkInGuide, houseRules, patch, setDirty, setSaving, router, toast]);

  if (!listing) return null;

  return (
    <div className="rounded-3xl border border-neutral-200 bg-white p-8 shadow-sm">
      <h2 className="text-xl font-semibold">안내 메시지</h2>
      <p className="mt-1 text-sm text-neutral-600">
        게스트에게 전달할 체크인 안내와 이용 규칙을 입력하세요. 예약 확정 후 안내에 활용됩니다.
      </p>

      <div className="mt-6 space-y-6">
        <div>
          <label className="block text-sm font-medium text-neutral-700">체크인 안내</label>
          <textarea
            value={checkInGuide}
            onChange={(e) => {
              setCheckInGuide(e.target.value);
              setDirty(true);
            }}
            placeholder="예: 현관 비밀번호, 키 보관함 위치, 주차 안내 등"
            rows={4}
            className="mt-2 w-full rounded-xl border border-neutral-200 px-4 py-3 text-sm"
            disabled={isLocked}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-neutral-700">이용 규칙·기타 안내</label>
          <textarea
            value={houseRules}
            onChange={(e) => {
              setHouseRules(e.target.value);
              setDirty(true);
            }}
            placeholder="예: 퇴실 시 정리 방법, 쓰레기 배출, 소음 안내 등"
            rows={4}
            className="mt-2 w-full rounded-xl border border-neutral-200 px-4 py-3 text-sm"
            disabled={isLocked}
          />
        </div>
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
          onClick={() => void goNext()}
          disabled={isLocked}
          className="rounded-2xl bg-neutral-900 px-6 py-3 text-sm font-medium text-white hover:bg-neutral-800 disabled:opacity-50"
        >
          다음: 사진
        </button>
      </div>
    </div>
  );
}
