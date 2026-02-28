"use client";

import { useRouter, useSearchParams } from "next/navigation";

type Listing = { id: string; title: string };

type Props = { listings: Listing[] };

export default function DashboardListingSelector({ listings }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentId = searchParams.get("listingId") ?? listings[0]?.id ?? "";

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm font-medium text-neutral-600">숙소:</span>
      <select
        value={currentId}
        onChange={(e) => {
          const id = e.target.value;
          const params = new URLSearchParams(searchParams.toString());
          if (id) params.set("listingId", id);
          else params.delete("listingId");
          router.push(`/host/dashboard?${params.toString()}`);
        }}
        className="rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm font-medium text-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-400 min-w-[180px]"
      >
        {listings.length === 0 ? (
          <option value="">숙소 없음</option>
        ) : (
          listings.map((l) => (
            <option key={l.id} value={l.id}>
              {l.title || `숙소 ${l.id.slice(0, 8)}`}
            </option>
          ))
        )}
      </select>
    </div>
  );
}
