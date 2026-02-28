"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Props = { date: string; isBlocked: boolean; listingId?: string | null };

export default function BlockDateButton({ date, isBlocked, listingId }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    if (loading) return;
    setLoading(true);
    const isPerListing = !!listingId;
    try {
      let res: Response;
      if (isPerListing) {
        const base = `/api/host/listings/${listingId}/blocked-dates`;
        if (isBlocked) {
          res = await fetch(`${base}?date=${encodeURIComponent(date)}`, { method: "DELETE" });
        } else {
          res = await fetch(base, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ date }),
          });
        }
      } else {
        const endpoint = isBlocked ? "/api/host/unblock-date" : "/api/host/block-date";
        res = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ date }),
        });
      }
      const json = await res.json().catch(() => ({}));
      const ok = json?.data?.ok === true || (isPerListing && res.ok);
      const errorMessage = json?.error?.message;
      if (ok) {
        router.refresh();
        window.location.reload();
      } else {
        alert(errorMessage ?? (isBlocked ? "판매 열기 처리 중 오류가 발생했습니다." : "해당 날짜를 닫는 중 오류가 발생했습니다."));
      }
    } catch {
      alert("요청을 처리할 수 없습니다.");
    } finally {
      setLoading(false);
    }
  };

  const isOpen = isBlocked;
  const label = loading ? "처리 중…" : isOpen ? "판매 열기" : "판매 닫기";
  const title = isOpen
    ? "이 날짜를 다시 예약받을 수 있게 합니다"
    : "이 날짜는 해당 숙소에서 예약받지 않습니다";

  return (
    <button
      type="button"
      title={title}
      aria-label={label}
      onClick={handleClick}
      disabled={loading}
      className={
        loading
          ? "rounded-xl border border-neutral-200 bg-neutral-100 px-3 py-2 text-xs font-semibold text-neutral-500 transition disabled:opacity-70"
          : isOpen
            ? "rounded-xl border-2 border-emerald-400 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 transition disabled:opacity-50"
            : "rounded-xl border-2 border-red-300 bg-white px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 transition disabled:opacity-50"
      }
    >
      {label}
    </button>
  );
}
