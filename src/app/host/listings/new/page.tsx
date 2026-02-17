"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { apiClient, ApiClientError } from "@/lib/api/client";

export default function HostNewListingPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [city, setCity] = useState("Seoul");
  const [area, setArea] = useState("Jongno");
  const [address, setAddress] = useState("");
  const [price, setPrice] = useState(120000);
  const [checkIn, setCheckIn] = useState("15:00");
  const [checkOut, setCheckOut] = useState("11:00");
  const [submitting, setSubmitting] = useState(false);

  const canSubmit = useMemo(
    () => name.trim().length >= 2 && city.trim().length >= 2 && area.trim().length >= 1 && address.trim().length >= 5,
    [name, city, area, address]
  );

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit || submitting) return;
    setSubmitting(true);

    try {
      await apiClient.post<{ id: string; status: "PENDING" | "APPROVED" | "REJECTED" }>(
        "/api/host/listings",
        {
          title: name,
          city,
          area,
          address,
          basePriceKrw: price,
          checkInTime: checkIn,
          checkOutTime: checkOut,
        }
      );

      router.push("/host/pending");
      router.refresh();
    } catch (err) {
      if (err instanceof ApiClientError) {
        alert(err.message);
      } else {
        alert("Network error while submitting listing.");
      }
      setSubmitting(false);
    }
  };

  return (
    <div className="rounded-3xl border border-neutral-200 bg-white shadow-sm p-8">
      <div className="text-2xl font-extrabold tracking-tight">숙소 등록</div>
      <p className="mt-2 text-sm text-neutral-600">
        최소 정보만 입력하면 됩니다. (MVP) 등록 후 운영팀 승인 완료 시 대시보드가 열립니다.
      </p>

      <form onSubmit={onSubmit} className="mt-6 grid gap-4 max-w-[720px]">
        <div>
          <label className="text-sm font-semibold">숙소 이름</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-2 w-full rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-neutral-900/10"
            placeholder="예) 해운대 오션뷰 스테이"
          />
        </div>

        <div>
          <label className="text-sm font-semibold">주소</label>
          <input
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className="mt-2 w-full rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-neutral-900/10"
            placeholder="예) 부산 해운대구 ..."
          />
          <div className="mt-1 text-xs text-neutral-500">* MVP에서는 지도 연동은 다음 단계에서 붙입니다.</div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-sm font-semibold">도시</label>
            <input
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="mt-2 w-full rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-neutral-900/10"
              placeholder="예) Seoul"
            />
          </div>
          <div>
            <label className="text-sm font-semibold">지역</label>
            <input
              value={area}
              onChange={(e) => setArea(e.target.value)}
              className="mt-2 w-full rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-neutral-900/10"
              placeholder="예) Jongno"
            />
          </div>
        </div>

        <div>
          <label className="text-sm font-semibold">1박 기본 요금 (원)</label>
          <input
            type="number"
            value={price}
            onChange={(e) => setPrice(Number(e.target.value || 0))}
            className="mt-2 w-full rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-neutral-900/10"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-sm font-semibold">체크인</label>
            <input
              value={checkIn}
              onChange={(e) => setCheckIn(e.target.value)}
              className="mt-2 w-full rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-neutral-900/10"
              placeholder="15:00"
            />
          </div>
          <div>
            <label className="text-sm font-semibold">체크아웃</label>
            <input
              value={checkOut}
              onChange={(e) => setCheckOut(e.target.value)}
              className="mt-2 w-full rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-neutral-900/10"
              placeholder="11:00"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={!canSubmit || submitting}
          className="mt-2 inline-flex items-center justify-center rounded-2xl bg-neutral-900 px-6 py-4 text-white text-sm font-semibold hover:opacity-95 transition disabled:opacity-40"
        >
          {submitting ? "등록 중..." : "등록 완료 (승인 요청)"}
        </button>
      </form>
    </div>
  );
}
