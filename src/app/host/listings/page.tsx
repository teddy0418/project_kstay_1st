import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentHostFlow } from "@/lib/host/server";
import { listHostListings } from "@/lib/repositories/host-listings";
import HostListingsTable from "@/features/host/listings/HostListingsTable";

export default async function HostListingsPage() {
  const current = await getCurrentHostFlow();
  if (!current) redirect("/login?next=/host/listings");

  if (current.status === "NONE") redirect("/host/onboarding");
  if (current.status === "PENDING") redirect("/host/pending");
  // DRAFT: stay and show draft listings

  const listings = await listHostListings(current.user.id);

  return (
    <div className="rounded-3xl border border-neutral-200 bg-white shadow-sm p-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="text-2xl font-extrabold tracking-tight">판매 관리</div>
          <p className="mt-2 text-sm text-neutral-600">숙소 정보/가격/판매 상태를 관리합니다. (MVP)</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex rounded-2xl border border-neutral-200 bg-white px-4 py-2.5 text-sm font-medium text-neutral-700 hover:bg-neutral-50 transition"
          >
            게스트 화면으로
          </Link>
          <Link
            href="/host/listings/new"
            className="inline-flex rounded-2xl bg-neutral-900 px-6 py-3 text-white text-sm font-semibold hover:opacity-95 transition"
          >
            새 숙소 등록
          </Link>
        </div>
      </div>

      <div className="mt-8">
        {listings.length === 0 ? (
          <p className="text-sm text-neutral-600">등록된 숙소가 없습니다. 새 숙소를 등록해 보세요.</p>
        ) : (
          <HostListingsTable listings={listings} />
        )}
      </div>
    </div>
  );
}
