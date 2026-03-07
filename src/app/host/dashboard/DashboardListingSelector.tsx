"use client";

import { useRouter } from "next/navigation";

type Listing = { id: string; title: string };

export default function DashboardListingSelector({
  listings,
  currentListingId,
}: {
  listings: Listing[];
  currentListingId: string | null;
}) {
  const router = useRouter();
  return (
    <div className="min-w-0">
      <label htmlFor="dashboard-listing" className="sr-only">
        숙소 선택
      </label>
      <select
        id="dashboard-listing"
        value={currentListingId ?? ""}
        onChange={(e) => {
          const id = e.target.value;
          if (id) router.push(`/host/dashboard?listingId=${encodeURIComponent(id)}`);
          else router.push("/host/dashboard");
        }}
        className="w-full min-w-0 max-w-[280px] rounded-xl border border-neutral-200 bg-white px-3 py-2.5 text-sm font-medium text-neutral-900"
      >
        <option value="">전체</option>
        {listings.map((l) => (
          <option key={l.id} value={l.id}>
            {l.title}
          </option>
        ))}
      </select>
    </div>
  );
}
