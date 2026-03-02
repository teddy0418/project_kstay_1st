"use client";

import { useState } from "react";
import { CheckCircle2 } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { getAmenityLabel } from "@/lib/amenities";
import { AMENITY_ICONS } from "@/lib/amenity-icons";
import { useI18n } from "@/components/ui/LanguageProvider";

const iconMap: Record<string, LucideIcon> = { ...AMENITY_ICONS };

const MAX_VISIBLE = 8;

type Lang = "ko" | "en" | "ja" | "zh";

export default function AmenitiesList({
  amenities,
  lang,
}: {
  amenities: string[];
  lang: Lang;
}) {
  const { t } = useI18n();
  const [expanded, setExpanded] = useState(false);
  const list = Array.isArray(amenities) ? amenities : [];
  const visible = expanded ? list : list.slice(0, MAX_VISIBLE);
  const hasMore = list.length > MAX_VISIBLE;
  const moreCount = list.length - MAX_VISIBLE;

  if (list.length === 0) {
    return <span className="text-neutral-500">—</span>;
  }

  return (
    <>
      <div className="grid grid-cols-2 gap-3 text-sm text-neutral-700">
        {visible.map((key) => {
          const Icon = iconMap[key] ?? CheckCircle2;
          return (
            <div key={key} className="flex items-center gap-2">
              <Icon className="h-4 w-4 shrink-0" />
              {getAmenityLabel(key, lang)}
            </div>
          );
        })}
      </div>
      {hasMore && (
        <button
          type="button"
          onClick={() => setExpanded((e) => !e)}
          className="mt-3 text-sm font-medium text-neutral-600 underline hover:text-neutral-900"
        >
          {expanded ? t("amenities_collapse") : t("amenities_show_more", { n: moreCount })}
        </button>
      )}
    </>
  );
}
