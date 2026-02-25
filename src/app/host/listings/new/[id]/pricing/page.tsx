"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useListingWizard } from "@/features/host/listings/ListingWizardContext";
import { useToast } from "@/components/ui/ToastProvider";

function parsePrice(v: string): number | undefined {
  const n = parseInt(v.replace(/,/g, ""), 10);
  return Number.isFinite(n) && n >= 0 ? n : undefined;
}

function parsePct(v: string): number | undefined {
  const n = parseInt(v.replace(/\D/g, ""), 10);
  return Number.isFinite(n) && n >= 0 && n <= 100 ? n : undefined;
}

export default function WizardPricingPage() {
  const { listing, patch, isLocked, dirty, setDirty, performSaveRef, setSaving, saving, performSave } = useListingWizard();
  const { toast } = useToast();
  const router = useRouter();

  const [basePriceKrw, setBasePriceKrw] = useState("");
  const [extraGuestFeeKrw, setExtraGuestFeeKrw] = useState("");
  const [weekendSurchargePct, setWeekendSurchargePct] = useState("");
  const [peakSurchargePct, setPeakSurchargePct] = useState("");
  const [nonRefundableSpecialEnabled, setNonRefundableSpecialEnabled] = useState(false);
  const [policyAgreed, setPolicyAgreed] = useState(false);

  useEffect(() => {
    if (!listing) return;
    const L = listing as typeof listing & { extraGuestFeeKrw?: number | null };
    setBasePriceKrw(listing.basePriceKrw != null ? String(listing.basePriceKrw) : "");
    setExtraGuestFeeKrw(L.extraGuestFeeKrw != null && L.extraGuestFeeKrw > 0 ? String(L.extraGuestFeeKrw) : "");
    setWeekendSurchargePct(
      listing.weekendSurchargePct != null ? String(listing.weekendSurchargePct) : "0"
    );
    setPeakSurchargePct(listing.peakSurchargePct != null ? String(listing.peakSurchargePct) : "0");
    setNonRefundableSpecialEnabled(listing.nonRefundableSpecialEnabled ?? false);
  }, [listing]);

  const payload = useCallback(() => {
    const base = parsePrice(basePriceKrw);
    const extra = parsePrice(extraGuestFeeKrw);
    const weekend = parsePct(weekendSurchargePct);
    const peak = parsePct(peakSurchargePct);
    return {
      basePriceKrw: base ?? 0,
      extraGuestFeeKrw: extra != null && extra > 0 ? extra : null,
      weekendSurchargePct: weekend ?? 0,
      peakSurchargePct: peak ?? 0,
      nonRefundableSpecialEnabled,
    };
  }, [basePriceKrw, extraGuestFeeKrw, weekendSurchargePct, peakSurchargePct, nonRefundableSpecialEnabled]);

  const save = useCallback(async () => {
    if (!listing || isLocked) return;
    const n = parsePrice(basePriceKrw);
    if (n == null) return;
    setSaving(true);
    try {
      await patch(payload());
      setDirty(false);
      toast("저장됨");
    } finally {
      setSaving(false);
    }
  }, [listing, isLocked, patch, basePriceKrw, payload, setDirty, setSaving, toast]);

  useEffect(() => {
    performSaveRef.current = save;
    return () => {
      performSaveRef.current = null;
    };
  }, [performSaveRef, save]);

  const goNext = useCallback(async () => {
    if (!listing) return;
    if (!policyAgreed) {
      toast("표준 환불 정책에 동의해 주세요.");
      return;
    }
    const n = parsePrice(basePriceKrw);
    if (n == null || n <= 0) {
      toast("평일 기본 요금을 입력해 주세요.");
      return;
    }
    setSaving(true);
    try {
      await patch(payload());
      setDirty(false);
      router.push(`/host/listings/new/${listing.id}/amenities`);
    } catch {
      toast("저장에 실패했습니다.");
    } finally {
      setSaving(false);
    }
  }, [listing, policyAgreed, basePriceKrw, payload, patch, setDirty, setSaving, router, toast]);

  if (!listing) return null;

  return (
    <div className="rounded-3xl border border-neutral-200 bg-white p-8 shadow-sm">
      <h2 className="text-xl font-semibold">가격 및 환불 설정</h2>
      <p className="mt-1 text-sm text-neutral-600">평일 기본 요금과 선택 항목을 설정하세요.</p>

      {/* ① 평일 기본 요금 (1박 기준) */}
      <section className="mt-8">
        <h3 className="text-sm font-medium text-neutral-800">① 평일 기본 요금 (1박 기준)</h3>
        <div className="mt-2 flex items-center gap-2">
          <input
            inputMode="numeric"
            value={basePriceKrw}
            onChange={(e) => {
              setDirty(true);
              setBasePriceKrw(e.target.value.replace(/[^\d,]/g, ""));
            }}
            disabled={isLocked}
            placeholder="120000"
            className="w-full max-w-xs rounded-2xl border border-neutral-200 px-4 py-3 text-sm disabled:bg-neutral-50"
          />
          <span className="text-sm text-neutral-600">원</span>
        </div>
        <p className="mt-1 text-xs text-neutral-500">숫자만 입력</p>
      </section>

      {/* ② 인원 추가당 금액 (선택) */}
      <section className="mt-8">
        <h3 className="text-sm font-medium text-neutral-800">② 인원 추가당 금액 (선택)</h3>
        <p className="mt-0.5 text-xs text-neutral-500">최대 인원 초과 시 추가되는 1인당 요금입니다. 없으면 0원으로 둡니다.</p>
        <div className="mt-2 flex items-center gap-2">
          <input
            inputMode="numeric"
            value={extraGuestFeeKrw}
            onChange={(e) => {
              setDirty(true);
              setExtraGuestFeeKrw(e.target.value.replace(/[^\d,]/g, ""));
            }}
            disabled={isLocked}
            placeholder="0"
            className="w-full max-w-xs rounded-2xl border border-neutral-200 px-4 py-3 text-sm disabled:bg-neutral-50"
          />
          <span className="text-sm text-neutral-600">원/인</span>
        </div>
      </section>

      {/* ③ 주말/성수기 할증 (선택) */}
      <section className="mt-8">
        <h3 className="text-sm font-medium text-neutral-800">③ 주말/성수기 할증 (선택)</h3>
        <div className="mt-3 flex flex-wrap gap-6">
          <div>
            <label className="text-xs text-neutral-600">주말(금, 토) 할증</label>
            <div className="flex items-center gap-2">
              <input
                inputMode="numeric"
                value={weekendSurchargePct}
                onChange={(e) => {
                  setDirty(true);
                  setWeekendSurchargePct(e.target.value.replace(/\D/g, "").slice(0, 3));
                }}
                disabled={isLocked}
                placeholder="0"
                className="mt-1 w-20 rounded-xl border border-neutral-200 px-3 py-2 text-sm disabled:bg-neutral-50"
              />
              <span className="text-sm text-neutral-600">%</span>
            </div>
          </div>
          <div>
            <label className="text-xs text-neutral-600">성수기 할증</label>
            <div className="flex items-center gap-2">
              <input
                inputMode="numeric"
                value={peakSurchargePct}
                onChange={(e) => {
                  setDirty(true);
                  setPeakSurchargePct(e.target.value.replace(/\D/g, "").slice(0, 3));
                }}
                disabled={isLocked}
                placeholder="0"
                className="mt-1 w-20 rounded-xl border border-neutral-200 px-3 py-2 text-sm disabled:bg-neutral-50"
              />
              <span className="text-sm text-neutral-600">%</span>
            </div>
          </div>
        </div>
        <p className="mt-2 text-xs text-neutral-500">
          성수기 기간은 KSTAY 표준 달력에 따라 자동 적용됩니다.
        </p>
      </section>

      {/* ④ 환불 불가 특가 옵션 */}
      <section className="mt-8">
        <h3 className="text-sm font-medium text-neutral-800">
          ④ 환불 불가 특가 옵션 <span className="text-amber-600">★ 강력 추천</span>
        </h3>
        <label className="mt-3 flex cursor-pointer items-start gap-3">
          <input
            type="checkbox"
            checked={nonRefundableSpecialEnabled}
            onChange={(e) => {
              setDirty(true);
              setNonRefundableSpecialEnabled(e.target.checked);
            }}
            disabled={isLocked}
            className="mt-1 rounded border-neutral-300"
          />
          <span className="text-sm text-neutral-700">
            &quot;환불 불가 특가&quot;를 활성화하여 예약률을 높이겠습니다.
          </span>
        </label>
        <p className="mt-2 text-xs text-neutral-500">
          게스트에게 10% 할인을 제공하는 대신, 예약 24시간 이후에는 환불이 불가능한 옵션입니다.
          노쇼 방지에 효과적입니다.
        </p>
      </section>

      {/* ⑤ 표준 환불 정책 확인 (고정) */}
      <section className="mt-8 rounded-2xl border border-neutral-200 bg-neutral-50 p-4">
        <h3 className="text-sm font-medium text-neutral-800">⑤ 표준 환불 정책 확인 (고정)</h3>
        <p className="mt-2 text-sm text-neutral-700">
          KSTAY 표준 환불 정책은 아래와 같습니다.
        </p>
        <ul className="mt-3 list-inside list-disc space-y-1.5 text-sm text-neutral-700">
          <li>
            <strong>5일 전 100% 환불:</strong> 체크인 5일 전 23:59 KST까지 취소 시 전액 환불
          </li>
          <li>
            <strong>24시간 무료 취소:</strong> 예약 후 24시간 내 취소 시 100% 환불
            <span className="text-neutral-600"> (단, 체크인 48시간 전에 한 예약만 해당)</span>
          </li>
          <li>
            <strong>5일 전 이후:</strong> 체크인 5일 전부터는 환불 불가 (노쇼 포함)
          </li>
        </ul>
        <label className="mt-4 flex cursor-pointer items-start gap-3">
          <input
            type="checkbox"
            checked={policyAgreed}
            onChange={(e) => setPolicyAgreed(e.target.checked)}
            disabled={isLocked}
            className="mt-0.5 rounded border-neutral-300"
          />
          <span className="text-sm font-medium text-neutral-800">
            위 정책을 확인했으며 이에 동의합니다. <span className="text-red-600">(필수)</span>
          </span>
        </label>
      </section>

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
          다음: 어메니티
        </button>
      </div>
    </div>
  );
}
