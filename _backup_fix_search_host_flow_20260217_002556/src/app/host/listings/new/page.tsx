"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

function setCookie(name: string, value: string, days = 365) {
  const maxAge = days * 24 * 60 * 60;
  document.cookie = `${name}=${encodeURIComponent(value)}; Max-Age=${maxAge}; Path=/; SameSite=Lax`;
}

export default function NewHostListingPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [addr, setAddr] = useState("");
  const [price, setPrice] = useState("");

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    setCookie("kstay_host_has_listing", "1");

    try {
      localStorage.setItem("kstay_host_listing_draft", JSON.stringify({ name, addr, price }));
    } catch {}

    router.replace("/host");
  };

  return (
    <div className="rounded-3xl border border-neutral-200 bg-white shadow-sm p-6 max-w-[820px]">
      <div className="text-xl font-extrabold tracking-tight">숙소 등록</div>
      <div className="mt-2 text-sm text-neutral-500">
        MVP 단계에서는 필수 정보만 입력합니다. (주소 지도 연동/사진 업로드는 다음 단계에서 고도화)
      </div>

      <form onSubmit={onSubmit} className="mt-6 grid gap-4">
        <div>
          <label className="text-sm font-semibold">숙소 이름</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="예: 인스파이어 리조트"
            className="mt-2 w-full rounded-2xl border border-neutral-200 px-4 py-3 text-sm outline-none focus:border-neutral-900"
            required
          />
        </div>

        <div>
          <label className="text-sm font-semibold">주소</label>
          <input
            value={addr}
            onChange={(e) => setAddr(e.target.value)}
            placeholder="예: 인천광역시 중구 …"
            className="mt-2 w-full rounded-2xl border border-neutral-200 px-4 py-3 text-sm outline-none focus:border-neutral-900"
            required
          />
        </div>

        <div>
          <label className="text-sm font-semibold">1박 기본 요금(원)</label>
          <input
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="예: 150000"
            inputMode="numeric"
            className="mt-2 w-full rounded-2xl border border-neutral-200 px-4 py-3 text-sm outline-none focus:border-neutral-900"
            required
          />
        </div>

        <button
          type="submit"
          className="mt-2 inline-flex items-center justify-center rounded-2xl bg-neutral-900 px-5 py-4 text-white text-sm font-semibold hover:opacity-95 transition"
        >
          등록 완료(대시보드로)
        </button>

        <div className="text-xs text-neutral-500">
          * DB 연동 후에는 &apos;등록된 숙소 0개면 온보딩, 1개 이상이면 대시보드&apos;가 자동으로 동작합니다.
        </div>
      </form>
    </div>
  );
}
