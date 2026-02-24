"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useListingWizard } from "@/features/host/listings/ListingWizardContext";
import { useToast } from "@/components/ui/ToastProvider";

function parsePrice(v: string): number | undefined {
  const n = parseInt(v.replace(/,/g, ""), 10);
  return Number.isFinite(n) && n >= 0 ? n : undefined;
}

export default function WizardPricingPage() {
  const { listing, patch, isLocked, dirty, setDirty, performSaveRef, setSaving } = useListingWizard();
  const { toast } = useToast();
  const router = useRouter();
  const [basePriceKrw, setBasePriceKrw] = useState("");

  useEffect(() => {
    if (!listing) return;
    setBasePriceKrw(listing.basePriceKrw != null ? String(listing.basePriceKrw) : "");
  }, [listing]);

  const save = useCallback(async () => {
    if (!listing || isLocked) return;
    const n = parsePrice(basePriceKrw);
    if (n == null) return;
    setSaving(true);
    try {
      await patch({ basePriceKrw: n });
      setDirty(false);
      toast("저장됨");
    } finally {
      setSaving(false);
    }
  }, [listing, isLocked, patch, basePriceKrw, setDirty, setSaving, toast]);

  useEffect(() => {
    performSaveRef.current = save;
    return () => {
      performSaveRef.current = null;
    };
  }, [performSaveRef, save]);

  const goNext = useCallback(async () => {
    if (!listing) return;
    if (dirty) {
      const n = parsePrice(basePriceKrw);
      if (n != null) {
        setSaving(true);
        try {
          await patch({ basePriceKrw: n });
          setDirty(false);
          router.push(`/host/listings/new/${listing.id}/amenities`);
        } catch {
          toast("저장에 실패했습니다.");
        } finally {
          setSaving(false);
        }
      } else {
        router.push(`/host/listings/new/${listing.id}/amenities`);
      }
    } else {
      router.push(`/host/listings/new/${listing.id}/amenities`);
    }
  }, [listing, dirty, basePriceKrw, patch, setDirty, setSaving, router, toast]);

  if (!listing) return null;

  return (
    <div className="rounded-3xl border border-neutral-200 bg-white p-8 shadow-sm">
      <h2 className="text-xl font-semibold">가격</h2>
      <p className="mt-1 text-sm text-neutral-600">1박 기준 가격(원)을 입력하세요.</p>

      <div className="mt-6">
        <label className="text-sm font-medium text-neutral-700">1박 기준가 (원)</label>
        <input
          inputMode="numeric"
          value={basePriceKrw}
          onChange={(e) => {
            setDirty(true);
            setBasePriceKrw(e.target.value.replace(/[^\d,]/g, ""));
          }}
          disabled={isLocked}
          placeholder="120000"
          className="mt-2 w-full max-w-xs rounded-2xl border border-neutral-200 px-4 py-3 text-sm disabled:bg-neutral-50"
        />
      </div>

      <div className="mt-8 flex justify-end">
        <button
          type="button"
          onClick={() => void goNext()}
          disabled={isLocked}
          className="rounded-2xl bg-neutral-900 px-6 py-3 text-sm font-medium text-white hover:bg-neutral-800 disabled:opacity-50"
        >
          다음: 어메니티
        </button>
      </div>
    </div>
  );
}
