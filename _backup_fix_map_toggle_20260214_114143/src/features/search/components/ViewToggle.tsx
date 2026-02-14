"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { List, Map as MapIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export default function ViewToggle({ className }: { className?: string }) {
  const router = useRouter();
  const sp = useSearchParams();
  const isMap = sp.get("view") === "map";

  const onToggle = () => {
    const params = new URLSearchParams(sp.toString());
    if (isMap) params.delete("view");
    else params.set("view", "map");

    const qs = params.toString();
    router.push(qs ? `/?${qs}` : "/");
  };

  return (
    <button
      type="button"
      onClick={onToggle}
      className={cn(
        "inline-flex items-center gap-2 rounded-full border border-neutral-200 px-4 py-2 text-sm hover:bg-neutral-50",
        className
      )}
      aria-label={isMap ? "Show list" : "Show map"}
    >
      {isMap ? <List className="h-4 w-4" /> : <MapIcon className="h-4 w-4" />}
      {isMap ? "Show list" : "Show map"}
    </button>
  );
}
