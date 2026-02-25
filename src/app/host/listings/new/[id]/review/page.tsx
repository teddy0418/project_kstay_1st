"use client";

import { useState, useRef } from "react";
import { useListingWizard } from "@/features/host/listings/ListingWizardContext";
import { getAmenityLabel } from "@/lib/amenities";
import { useToast } from "@/components/ui/ToastProvider";

function pickTitle(l: { title?: string | null; titleKo?: string | null }) {
  return (l.title?.trim() || l.titleKo?.trim() || "") || "—";
}

const DOC_LABELS = [
  { key: "business_registration" as const, label: "사업자등록증", field: "businessRegistrationDocUrl" as const },
  { key: "lodging_report" as const, label: "숙소 유형별 신고·지정증", field: "lodgingReportDocUrl" as const },
];

export default function WizardReviewPage() {
  const { listing, reload, patch, isLocked } = useListingWizard();
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [uploadingDoc, setUploadingDoc] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  if (!listing) return null;

  const title = pickTitle(listing);
  const hasTitle = title !== "—" && title.length >= 2;
  const hasAddress = !!(listing.city?.trim() && listing.area?.trim() && listing.address?.trim());
  const hasPrice = Number(listing.basePriceKrw) > 0;
  const hasImages = (listing.images?.length ?? 0) >= 5;
  const hasDescription = (listing.hostBioKo?.trim() || listing.hostBio?.trim() || "").length >= 20;
  const incomplete: string[] = [];
  if (!hasTitle) incomplete.push("제목");
  if (!hasAddress) incomplete.push("위치/주소");
  if (!hasPrice) incomplete.push("가격");
  if (!hasImages) incomplete.push("사진(5장 이상)");
  if (!hasDescription) incomplete.push("숙소정보(숙소 설명)");
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

  async function onDocumentFileChange(docType: "business_registration" | "lodging_report", file: File | null) {
    if (!listing || !file) return;
    const meta = DOC_LABELS.find((d) => d.key === docType);
    if (!meta) return;
    setUploadingDoc(docType);
    try {
      const formData = new FormData();
      formData.set("type", docType);
      formData.set("file", file);
      const res = await fetch(`/api/host/listings/${listing.id}/documents/upload`, {
        method: "POST",
        credentials: "same-origin",
        body: formData,
      });
      const json = (await res.json()) as { data?: { url?: string }; error?: { message?: string } };
      if (!res.ok) throw new Error(json?.error?.message ?? "업로드 실패");
      const url = json?.data?.url;
      if (url) await patch({ [meta.field]: url });
      toast(meta.label + " 업로드됨");
      if (fileInputRefs.current[docType]) fileInputRefs.current[docType]!.value = "";
    } catch (e) {
      toast(e instanceof Error ? e.message : "업로드 실패");
    } finally {
      setUploadingDoc(null);
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
          <h3 className="text-sm font-medium text-neutral-500">숙소정보</h3>
          <p className="mt-1 text-sm text-neutral-700 whitespace-pre-line line-clamp-4">
            {listing.hostBioKo?.trim() || listing.hostBio?.trim() || "—"}
          </p>
        </div>
        <div className="rounded-2xl border border-neutral-200 p-4">
          <h3 className="text-sm font-medium text-neutral-500">사진 및 서류</h3>
          <p className="mt-1 font-medium">사진 {listing.images?.length ?? 0}장</p>
          <p className="mt-3 text-xs text-neutral-500 mb-3">
            아래 서류를 업로드할 수 있습니다. 이미지 또는 PDF (각 10MB 이하)
          </p>
          <div className="space-y-3">
            {DOC_LABELS.map(({ key, label, field }) => {
              const docListing = listing as typeof listing & { businessRegistrationDocUrl?: string | null; lodgingReportDocUrl?: string | null };
              const currentUrl = docListing[field];
              const isUploading = uploadingDoc === key;
              return (
                <div key={key} className="flex flex-wrap items-center gap-3 rounded-xl border border-neutral-100 bg-neutral-50/50 p-3">
                  <span className="text-sm font-medium text-neutral-800 w-48 shrink-0">{label}</span>
                  <input
                    ref={(el) => { fileInputRefs.current[key] = el; }}
                    type="file"
                    accept=".jpg,.jpeg,.png,.webp,.pdf,image/jpeg,image/png,image/webp,application/pdf"
                    disabled={isLocked || isUploading}
                    className="text-sm file:mr-2 file:rounded-lg file:border-0 file:bg-neutral-200 file:px-3 file:py-1.5 file:text-sm"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) onDocumentFileChange(key, f);
                    }}
                  />
                  {isUploading && <span className="text-xs text-neutral-500">업로드 중…</span>}
                  {currentUrl && !isUploading && (
                    <a href={currentUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline">
                      보기
                    </a>
                  )}
                </div>
              );
            })}
          </div>
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
