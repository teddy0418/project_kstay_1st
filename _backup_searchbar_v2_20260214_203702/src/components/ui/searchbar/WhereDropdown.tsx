"use client";

import { MapPin, X } from "lucide-react";
import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";

type City = { label: string; value: string };

const CITIES: City[] = [
  { label: "서울", value: "Seoul" },
  { label: "부산", value: "Busan" },
  { label: "제주", value: "Jeju" },
  { label: "인천", value: "Incheon" },
  { label: "경주", value: "Gyeongju" },
  { label: "강릉", value: "Gangneung" },
  { label: "대구", value: "Daegu" },
  { label: "대전", value: "Daejeon" },
];

export default function WhereDropdown({
  value,
  onSelect,
  onClose,
}: {
  value: string;
  onSelect: (v: string) => void;
  onClose: () => void;
}) {
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    const qq = q.trim().toLowerCase();
    if (!qq) return CITIES;
    return CITIES.filter((c) =>
      (c.label + " " + c.value).toLowerCase().includes(qq)
    );
  }, [q]);

  return (
    <div className="w-full max-w-[560px] rounded-2xl border border-neutral-200 bg-white shadow-md">
      <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-100">
        <div className="text-sm font-semibold">어디로 갈까요?</div>
        <button
          type="button"
          onClick={onClose}
          className="inline-flex h-9 w-9 items-center justify-center rounded-full hover:bg-neutral-100 transition"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="p-4">
        <div className="flex items-center gap-2 rounded-xl border border-neutral-200 bg-white px-3 py-2">
          <MapPin className="h-4 w-4 text-neutral-500" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="도시/지역 검색 (예: Seoul, 부산)"
            className="w-full text-sm outline-none placeholder:text-neutral-400"
            autoFocus
          />
        </div>

        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          {filtered.map((c) => {
            const active = value === c.value;
            return (
              <button
                key={c.value}
                type="button"
                onClick={() => {
                  onSelect(c.value);
                  onClose();
                }}
                className={cn(
                  "rounded-xl border px-3 py-3 text-left text-sm font-semibold transition",
                  active
                    ? "border-neutral-900 bg-neutral-900 text-white"
                    : "border-neutral-200 hover:bg-neutral-50"
                )}
              >
                <div>{c.label}</div>
                <div
                  className={cn(
                    "text-xs",
                    active ? "text-white/80" : "text-neutral-500"
                  )}
                >
                  {c.value}
                </div>
              </button>
            );
          })}
        </div>

        <div className="mt-4 flex justify-end">
          <button
            type="button"
            onClick={() => {
              onSelect("");
              onClose();
            }}
            className="rounded-xl border border-neutral-200 px-4 py-2 text-sm font-semibold hover:bg-neutral-50 transition"
          >
            어디든지
          </button>
        </div>
      </div>
    </div>
  );
}
