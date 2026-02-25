"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useListingWizard } from "@/features/host/listings/ListingWizardContext";
import { useToast } from "@/components/ui/ToastProvider";
import { AMENITY_CATEGORIES } from "@/lib/amenities";
import { AMENITY_ICONS } from "@/lib/amenity-icons";

export default function WizardAmenitiesPage() {
  const { listing, patch, isLocked, dirty, setDirty, performSaveRef, setSaving, saving, performSave } = useListingWizard();
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
    if (selected.size < 1) {
      toast("어메니티를 1개 이상 선택해 주세요.");
      return;
    }
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
    <div className="rounded-3xl border border-neutral-200 bg-white p-6 sm:p-8 shadow-sm">
      <h2 className="text-xl font-semibold">어메니티</h2>
      <p className="mt-1 text-sm text-neutral-600">제공하는 편의시설을 선택하세요. (1개 이상)</p>

      <div className="mt-6 space-y-8">
        {AMENITY_CATEGORIES.map((category) => (
          <section key={category.key}>
            <h3 className="text-sm font-semibold text-neutral-500 uppercase tracking-wide mb-3">
              [{category.labelKo}]
            </h3>
            <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {category.items.map((item) => {
                const Icon = AMENITY_ICONS[item.key];
                const isSelected = selected.has(item.key);
                return (
                  <li key={item.key}>
                    <label
                      className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3 transition ${
                        isSelected ? "border-neutral-900 bg-neutral-50" : "border-neutral-200 hover:bg-neutral-50/50"
                      } ${isLocked ? "cursor-not-allowed opacity-60" : ""}`}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggle(item.key)}
                        disabled={isLocked}
                        className="h-4 w-4 shrink-0 rounded border-neutral-300"
                      />
                      {Icon && <Icon className="h-5 w-5 shrink-0 text-neutral-600" aria-hidden />}
                      <span className="min-w-0">
                        <span className="block text-sm font-medium text-neutral-900">{item.ko}</span>
                        <span className="block text-xs text-neutral-500">{item.en}</span>
                      </span>
                    </label>
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
      </div>

      <div className="mt-8 flex justify-end gap-3">
        <button
          type="button"
          onClick={() => void performSave()}
          disabled={isLocked || !dirty || saving}
          className="rounded-2xl border border-neutral-200 bg-white px-6 py-3 text-sm font-medium text-neutral-900 hover:bg-neutral-50 disabled:opacity-50"
        >
          {saving ? "저장 중…" : "저장"}
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
