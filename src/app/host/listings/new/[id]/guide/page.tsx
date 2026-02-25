"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useListingWizard } from "@/features/host/listings/ListingWizardContext";
import { useToast } from "@/components/ui/ToastProvider";
import { PROPERTY_TYPES, normalizePropertyType } from "@/lib/property-types";

function pickTitle(l: { title?: string | null; titleKo?: string | null }) {
  return (l.title?.trim() || l.titleKo?.trim() || "") as string;
}

const HOURS = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, "0"));
const MINUTES = Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, "0"));

function TimeSelect({
  value,
  onChange,
  disabled,
  className = "",
}: {
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
  className?: string;
}) {
  const [h = "15", m = "00"] = value.split(":");
  const handleChange = (newH: string, newM: string) => onChange(`${newH}:${newM}`);
  const inputStyle =
    "w-full rounded-2xl border border-neutral-200 bg-white px-3 py-3 text-sm text-neutral-800 focus:border-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-400/20 disabled:bg-neutral-50 disabled:text-neutral-500";
  return (
    <div className={`flex gap-2 ${className}`}>
      <select value={h} onChange={(e) => handleChange(e.target.value, m)} disabled={disabled} className={inputStyle} aria-label="시">
        {HOURS.map((hour) => (
          <option key={hour} value={hour}>{hour}시</option>
        ))}
      </select>
      <select value={m} onChange={(e) => handleChange(h, e.target.value)} disabled={disabled} className={inputStyle} aria-label="분">
        {MINUTES.map((min) => (
          <option key={min} value={min}>{min}분</option>
        ))}
      </select>
    </div>
  );
}

export default function WizardGuidePage() {
  const { listing, patch, isLocked, dirty, setDirty, performSaveRef, setSaving, saving, performSave } = useListingWizard();
  const { toast } = useToast();
  const router = useRouter();

  const [listingName, setListingName] = useState("");
  const [propertyType, setPropertyType] = useState("");
  const [maxGuests, setMaxGuests] = useState<number>(2);
  const [checkInTime, setCheckInTime] = useState("15:00");
  const [checkOutTime, setCheckOutTime] = useState("11:00");
  const [description, setDescription] = useState("");
  const [checkInGuide, setCheckInGuide] = useState("");
  const [houseRules, setHouseRules] = useState("");

  useEffect(() => {
    if (!listing) return;
    setListingName(pickTitle(listing) || "");
    setPropertyType(normalizePropertyType((listing as { propertyType?: string | null }).propertyType));
    setMaxGuests((listing as { maxGuests?: number | null }).maxGuests ?? 2);
    setCheckInTime(listing.checkInTime ?? "15:00");
    setCheckOutTime(listing.checkOutTime ?? "11:00");
    const bioKo = (listing as { hostBioKo?: string | null }).hostBioKo ?? "";
    const bio = listing.hostBio ?? "";
    setDescription(bioKo.trim() || bio.trim());
    setCheckInGuide((listing as { checkInGuideMessage?: string | null }).checkInGuideMessage ?? "");
    setHouseRules((listing as { houseRulesMessage?: string | null }).houseRulesMessage ?? "");
  }, [listing]);

  const save = useCallback(async () => {
    if (!listing || isLocked) return;
    setSaving(true);
    try {
      const name = listingName.trim() || "제목 없음";
      const desc = description.trim() || null;
      await patch({
        title: name,
        titleKo: name,
        propertyType: propertyType.trim() || null,
        maxGuests: maxGuests >= 1 ? maxGuests : null,
        checkInTime: checkInTime || undefined,
        checkOutTime: checkOutTime || undefined,
        hostBio: desc,
        hostBioKo: desc,
        checkInGuideMessage: checkInGuide.trim() || null,
        houseRulesMessage: houseRules.trim() || null,
      });
      setDirty(false);
      toast("저장됨");
    } finally {
      setSaving(false);
    }
  }, [listing, isLocked, patch, listingName, propertyType, maxGuests, checkInTime, checkOutTime, description, checkInGuide, houseRules, setDirty, setSaving, toast]);

  useEffect(() => {
    performSaveRef.current = save;
    return () => {
      performSaveRef.current = null;
    };
  }, [performSaveRef, save]);

  const canGoNext =
    listingName.trim().length > 0 &&
    listingName.trim() !== "신규 숙소" &&
    propertyType.trim().length > 0 &&
    maxGuests >= 1 &&
    description.trim().length >= 20;

  const goNext = useCallback(async () => {
    if (!listing) return;
    if (!canGoNext) {
      if (!listingName.trim() || listingName.trim() === "신규 숙소") {
        toast("숙소 이름을 입력해 주세요.");
        return;
      }
      if (!propertyType.trim()) {
        toast("숙소 유형을 선택해 주세요.");
        return;
      }
      if (maxGuests < 1) {
        toast("최대 숙박 인원을 선택해 주세요.");
        return;
      }
      if (description.trim().length < 20) {
        toast("숙소 설명을 20자 이상 입력해 주세요.");
        return;
      }
      return;
    }
    const target = `/host/listings/new/${listing.id}/review`;
    if (dirty) {
      setSaving(true);
      try {
        const name = listingName.trim() || "제목 없음";
        const desc = description.trim() || null;
        await patch({
          title: name,
          titleKo: name,
          propertyType: propertyType.trim() || null,
          maxGuests: maxGuests >= 1 ? maxGuests : null,
          checkInTime: checkInTime || undefined,
          checkOutTime: checkOutTime || undefined,
          hostBio: desc,
          hostBioKo: desc,
          checkInGuideMessage: checkInGuide.trim() || null,
          houseRulesMessage: houseRules.trim() || null,
        });
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
  }, [listing, dirty, canGoNext, listingName, propertyType, maxGuests, checkInTime, checkOutTime, description, checkInGuide, houseRules, patch, setDirty, setSaving, router, toast]);

  const handleChange = useCallback(() => setDirty(true), [setDirty]);

  if (!listing) return null;

  return (
    <div className="rounded-3xl border border-neutral-200 bg-white p-8 shadow-sm">
      <h2 className="text-xl font-semibold">숙소정보</h2>
      <p className="mt-1 text-sm text-neutral-500">
        숙소 이름·유형·인원, 체크인/아웃, 상세페이지에 보여질 설명과 예약 확정 후 전달할 안내를 입력하세요.
      </p>

      <div className="mt-6 space-y-8">
        {/* 기본 정보 (기존 basics) */}
        <section className="space-y-4">
          <h3 className="text-sm font-semibold text-neutral-700">기본</h3>
          <div>
            <label className="block text-sm font-medium text-neutral-700">숙소 이름</label>
            <input
              value={listingName}
              onChange={(e) => { handleChange(); setListingName(e.target.value); }}
              disabled={isLocked}
              placeholder="예: [Near Myeongdong] Cozy & Modern Studio (명동 근처 아늑하고 현대적인 스튜디오)"
              className="mt-2 w-full rounded-xl border border-neutral-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-400 disabled:bg-neutral-50"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700">숙소 유형</label>
            <select
              value={propertyType}
              onChange={(e) => { handleChange(); setPropertyType(e.target.value); }}
              disabled={isLocked}
              className="mt-2 w-full rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-400 disabled:bg-neutral-50"
            >
              <option value="">선택하세요</option>
              {PROPERTY_TYPES.map(({ value, label }) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700">최대 숙박 인원</label>
            <select
              value={maxGuests}
              onChange={(e) => { handleChange(); setMaxGuests(Number(e.target.value)); }}
              disabled={isLocked}
              className="mt-2 w-full rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-400 disabled:bg-neutral-50"
            >
              {Array.from({ length: 20 }, (_, i) => i + 1).map((n) => (
                <option key={n} value={n}>{n}명</option>
              ))}
            </select>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-neutral-700">체크인</label>
              <TimeSelect value={checkInTime} onChange={(v) => { handleChange(); setCheckInTime(v); }} disabled={isLocked} className="mt-2" />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700">체크아웃</label>
              <TimeSelect value={checkOutTime} onChange={(v) => { handleChange(); setCheckOutTime(v); }} disabled={isLocked} className="mt-2" />
            </div>
          </div>
        </section>

        {/* 숙소 설명 (상세페이지) */}
        <section>
          <h3 className="text-sm font-semibold text-neutral-700">숙소 설명 <span className="text-red-600">(필수)</span></h3>
          <p className="mt-0.5 text-xs text-neutral-500">상세페이지에 보여지는 메인 설명입니다. 20자 이상 입력해 주세요.</p>
          <textarea
            value={description}
            onChange={(e) => { setDescription(e.target.value); setDirty(true); }}
            placeholder="숙소의 특징, 분위기, 주변 교통·관광지, 편의시설 등을 소개해 주세요."
            rows={5}
            className="mt-2 w-full rounded-xl border border-neutral-200 px-4 py-3 text-sm placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-400 disabled:bg-neutral-50"
            disabled={isLocked}
          />
          <p className="mt-1 text-xs text-neutral-400">{description.trim().length}자</p>
        </section>

        {/* 체크인 안내 · 이용 규칙 */}
        <section className="space-y-4">
          <h3 className="text-sm font-semibold text-neutral-700">예약 확정 후 전달 안내</h3>
          <div>
            <label className="block text-sm font-medium text-neutral-700">체크인 안내</label>
            <textarea
              value={checkInGuide}
              onChange={(e) => { setCheckInGuide(e.target.value); setDirty(true); }}
              placeholder="예: 현관 비밀번호, 키 보관함 위치, 주차 안내 등"
              rows={3}
              className="mt-2 w-full rounded-xl border border-neutral-200 px-4 py-3 text-sm placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-400 disabled:bg-neutral-50"
              disabled={isLocked}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700">이용 규칙·기타</label>
            <textarea
              value={houseRules}
              onChange={(e) => { setHouseRules(e.target.value); setDirty(true); }}
              placeholder="예: 퇴실 시 정리 방법, 쓰레기 배출, 소음 안내 등"
              rows={3}
              className="mt-2 w-full rounded-xl border border-neutral-200 px-4 py-3 text-sm placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-400 disabled:bg-neutral-50"
              disabled={isLocked}
            />
          </div>
        </section>
      </div>

      <div className="mt-8 flex justify-end gap-3">
        <button
          type="button"
          onClick={() => router.push(`/host/listings/new/${listing.id}/photos`)}
          className="rounded-2xl border border-neutral-200 px-6 py-3 text-sm font-medium hover:bg-neutral-50"
        >
          이전
        </button>
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
          disabled={isLocked || !canGoNext}
          className="rounded-2xl bg-neutral-900 px-6 py-3 text-sm font-medium text-white hover:bg-neutral-800 disabled:opacity-50"
        >
          다음: 검토 및 승인요청
        </button>
      </div>
      {!canGoNext && (
        <p className="mt-2 text-center text-xs text-neutral-500">
          숙소 이름, 유형, 최대 인원, 숙소 설명(20자 이상)을 모두 입력하면 다음 단계로 이동할 수 있습니다.
        </p>
      )}
    </div>
  );
}
