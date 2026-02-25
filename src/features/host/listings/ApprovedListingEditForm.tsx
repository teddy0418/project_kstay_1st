"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiClient } from "@/lib/api/client";
import { useToast } from "@/components/ui/ToastProvider";

type Props = {
  listingId: string;
  initialCheckInGuideMessage: string;
  initialHouseRulesMessage: string;
  initialDetailedAddress: string;
};

export default function ApprovedListingEditForm({
  listingId,
  initialCheckInGuideMessage,
  initialHouseRulesMessage,
  initialDetailedAddress,
}: Props) {
  const router = useRouter();
  const { toast } = useToast();
  const [checkInGuideMessage, setCheckInGuideMessage] = useState(initialCheckInGuideMessage);
  const [houseRulesMessage, setHouseRulesMessage] = useState(initialHouseRulesMessage);
  const [detailedAddress, setDetailedAddress] = useState(initialDetailedAddress);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await apiClient.patch(`/api/host/listings/${listingId}`, {
        checkInGuideMessage: checkInGuideMessage.trim() || null,
        houseRulesMessage: houseRulesMessage.trim() || null,
        detailedAddress: detailedAddress.trim() || null,
      });
      toast("저장되었습니다.");
      router.refresh();
    } catch (err) {
      toast(err instanceof Error ? err.message : "저장에 실패했습니다.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-neutral-700">체크인 안내</label>
        <textarea
          value={checkInGuideMessage}
          onChange={(e) => setCheckInGuideMessage(e.target.value)}
          placeholder="예: 현관 비밀번호, 키 보관함 위치, 주차 안내 등"
          rows={4}
          className="mt-2 w-full rounded-xl border border-neutral-200 px-4 py-3 text-sm placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-400"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-neutral-700">이용 규칙·기타</label>
        <textarea
          value={houseRulesMessage}
          onChange={(e) => setHouseRulesMessage(e.target.value)}
          placeholder="예: 퇴실 시 정리 방법, 쓰레기 배출, 소음 안내 등"
          rows={4}
          className="mt-2 w-full rounded-xl border border-neutral-200 px-4 py-3 text-sm placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-400"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-neutral-700">상세 주소 (예약 확정 후 게스트에게 공개)</label>
        <input
          type="text"
          value={detailedAddress}
          onChange={(e) => setDetailedAddress(e.target.value)}
          placeholder="동·호수 등"
          className="mt-2 w-full rounded-xl border border-neutral-200 px-4 py-3 text-sm placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-400"
        />
      </div>
      <div className="flex justify-end gap-3">
        <button
          type="button"
          onClick={() => router.push("/host/listings")}
          className="rounded-2xl border border-neutral-200 px-6 py-3 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
        >
          취소
        </button>
        <button
          type="submit"
          disabled={saving}
          className="rounded-2xl bg-neutral-900 px-6 py-3 text-sm font-medium text-white hover:bg-neutral-800 disabled:opacity-50"
        >
          {saving ? "저장 중…" : "저장"}
        </button>
      </div>
    </form>
  );
}
