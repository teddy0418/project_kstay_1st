"use client";

import { MapPin, X } from "lucide-react";
import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { useI18n } from "@/components/ui/LanguageProvider";

type City = { label: string; value: string };

const CITIES: City[] = [
  { label: "Jeju", value: "Jeju" },
  { label: "Seoul", value: "Seoul" },
  { label: "Busan", value: "Busan" },
  { label: "Gangneung", value: "Gangneung" },
  { label: "Incheon", value: "Incheon" },
  { label: "Gyeongju", value: "Gyeongju" },
  { label: "Haeundae", value: "Haeundae" },
  { label: "Gapyeong", value: "Gapyeong" },
  { label: "Yeosu", value: "Yeosu" },
  { label: "Sokcho", value: "Sokcho" },
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
  const { t } = useI18n();
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    const qq = q.trim().toLowerCase();
    if (!qq) return CITIES;
    return CITIES.filter((c) => (c.label + " " + c.value).toLowerCase().includes(qq));
  }, [q]);

  return (
    <div className="w-full rounded-2xl border border-neutral-200 bg-white shadow-md">
      <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-100">
        <div className="text-sm font-semibold">{t("where_to")}</div>
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
            placeholder={t("search_cities_placeholder")}
            className="w-full text-sm outline-none placeholder:text-neutral-400"
            autoFocus
          />
        </div>

        <div className="mt-4">
          <div className="text-xs font-semibold text-neutral-500">{t("popular")}</div>
          <div className="mt-2 grid gap-2 sm:grid-cols-2">
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
                    active ? "border-neutral-900 bg-neutral-900 text-white" : "border-neutral-200 hover:bg-neutral-50"
                  )}
                >
                  <div>{c.label}</div>
                  <div className={cn("text-xs", active ? "text-white/80" : "text-neutral-500")}>Korea</div>
                </button>
              );
            })}
          </div>
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
            {t("anywhere")}
          </button>
        </div>
      </div>
    </div>
  );
}
