"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useListingWizard } from "@/features/host/listings/ListingWizardContext";
import { useToast } from "@/components/ui/ToastProvider";
import { AMENITY_KEYS, getAmenityLabel } from "@/lib/amenities";

export default function WizardAmenitiesPage() {
  const { listing, patch, isLocked, dirty, setDirty, performSaveRef, setSaving } = useListingWizard();
  const { toast } = useToast();
  const router = useRouter();
  const [selected, setSelected] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!listing) return;
    setSelected(new Set(Array.isArray(listing.amenities) ? listing.amenities : []));
  }, [listing]);

  const save = useCallback(async () => {
    if (!listing || isLocked) return;
    setSaving(true);
    try {
      await patch({ amenities: Array.from(selected) });
      setDirty(false);
      toast("저장됨");
    } finally {
      setSaving(false);
    }
  }, [listing, isLocked, patch, selected, setDirty, setSaving, toast]);

  useEffect(() => {
    performSaveRef.current = save;
    return () => {
      performSaveRef.current = null;
    };
  }, [performSaveRef, save]);

  const toggle = (key: string) => {
    if (isLocked) return;
    setDirty(true);
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const goNext = useCallback(async () => {
    if (!listing) return;
    const target = `/host/listings/new/${listing.id}/photos`;
    if (dirty) {
      setSaving(true);
      try {
        await patch({ amenities: Array.from(selected) });
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
  }, [listing, dirty, selected, patch, setDirty, setSaving, router, toast]);

  if (!listing) return null;

  return (
    <div className="rounded-3xl border border-neutral-200 bg-white p-8 shadow-sm">
      <h2 className="text-xl font-semibold">어메니티</h2>
      <p className="mt-1 text-sm text-neutral-600">제공하는 편의시설을 선택하세요.</p>

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        {AMENITY_KEYS.map((key) => (
          <label
            key={key}
            className={`flex cursor-pointer items-center gap-3 rounded-2xl border p-4 transition ${
              selected.has(key) ? "border-neutral-900 bg-neutral-50" : "border-neutral-200"
            } ${isLocked ? "cursor-not-allowed opacity-60" : ""}`}
          >
            <input
              type="checkbox"
              checked={selected.has(key)}
              onChange={() => toggle(key)}
              disabled={isLocked}
              className="h-4 w-4 rounded border-neutral-300"
            />
            <span className="text-sm font-medium">{getAmenityLabel(key, "ko")}</span>
          </label>
        ))}
      </div>

      <div className="mt-8 flex justify-end">
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
