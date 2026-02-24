"use client";

import { useState } from "react";
import { useListingWizard } from "@/features/host/listings/ListingWizardContext";
import { getAmenityLabel } from "@/lib/amenities";

function pickTitle(l: { title?: string | null; titleKo?: string | null }) {
  return (l.title?.trim() || l.titleKo?.trim() || "") || "—";
}

export default function WizardReviewPage() {
  const { listing, reload, patch, isLocked } = useListingWizard();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!listing) return null;

  const title = pickTitle(listing);
  const hasTitle = title !== "—" && title.length >= 2;
  const hasAddress = !!(listing.city?.trim() && listing.area?.trim() && listing.address?.trim());
  const hasPrice = Number(listing.basePriceKrw) > 0;
  const hasImages = listing.images?.length > 0;
  const incomplete: string[] = [];
  if (!hasTitle) incomplete.push("제목");
  if (!hasAddress) incomplete.push("위치/주소");
  if (!hasPrice) incomplete.push("가격");
  if (!hasImages) incomplete.push("사진(1장 이상 권장)");
  const canSubmit = incomplete.length === 0;

  async function requestApproval() {
    if (!listing || isLocked || !canSubmit) return;
    setSubmitting(true);
    setError(null);
    try {
      await patch({ status: "PENDING" });
      await reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : "승인 요청 실패");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="rounded-3xl border border-neutral-200 bg-white p-8 shadow-sm">
      <h2 className="text-xl font-semibold">검토 및 승인요청</h2>
      <p className="mt-1 text-sm text-neutral-600">내용을 확인한 뒤 검토 요청을 보내세요.</p>

      <div className="mt-6 space-y-4">
        <div className="rounded-2xl border border-neutral-200 p-4">
          <h3 className="text-sm font-medium text-neutral-500">제목</h3>
          <p className="mt-1 font-medium">{title}</p>
        </div>
        <div className="rounded-2xl border border-neutral-200 p-4">
          <h3 className="text-sm font-medium text-neutral-500">위치</h3>
          <p className="mt-1 font-medium">{listing.city} · {listing.area}</p>
          <p className="mt-1 text-sm text-neutral-600">{listing.address}</p>
        </div>
        <div className="rounded-2xl border border-neutral-200 p-4">
          <h3 className="text-sm font-medium text-neutral-500">1박 기준가</h3>
          <p className="mt-1 font-medium">{Number(listing.basePriceKrw).toLocaleString()}원</p>
        </div>
        <div className="rounded-2xl border border-neutral-200 p-4">
          <h3 className="text-sm font-medium text-neutral-500">체크인/아웃</h3>
          <p className="mt-1 font-medium">{listing.checkInTime ?? "15:00"} / {listing.checkOutTime ?? "11:00"}</p>
        </div>
        {listing.amenities?.length > 0 && (
          <div className="rounded-2xl border border-neutral-200 p-4">
            <h3 className="text-sm font-medium text-neutral-500">어메니티</h3>
            <p className="mt-1 text-sm">{listing.amenities.map((k) => getAmenityLabel(k, "ko")).join(", ")}</p>
          </div>
        )}
        <div className="rounded-2xl border border-neutral-200 p-4">
          <h3 className="text-sm font-medium text-neutral-500">사진</h3>
          <p className="mt-1 font-medium">{listing.images?.length ?? 0}장</p>
        </div>
      </div>

      {incomplete.length > 0 && (
        <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          미완료: {incomplete.join(", ")}. 위 단계에서 입력 후 다시 확인하세요.
        </div>
      )}

      {error && (
        <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          {error}
        </div>
      )}

      <div className="mt-8 flex flex-wrap items-center gap-4">
        <button
          type="button"
          onClick={() => void requestApproval()}
          disabled={isLocked || submitting || !canSubmit}
          className="rounded-2xl bg-neutral-900 px-6 py-3 text-sm font-medium text-white hover:bg-neutral-800 disabled:opacity-50"
        >
          {submitting ? "처리 중…" : "승인요청 (PENDING)"}
        </button>
      </div>

      {listing.status === "PENDING" && (
        <p className="mt-6 rounded-2xl border border-green-200 bg-green-50 p-4 text-sm text-green-800">
          검토 요청이 완료되었습니다. (상태: PENDING)
        </p>
      )}
    </div>
  );
}
