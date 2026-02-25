import { redirect } from "next/navigation";
import Link from "next/link";
import { getOrCreateServerUser } from "@/lib/auth/server";
import { findHostListingForEdit } from "@/lib/repositories/host-listings";
import ApprovedListingEditForm from "@/features/host/listings/ApprovedListingEditForm";

type Props = { params: Promise<{ id: string }> };

export default async function ApprovedEditPage({ params }: Props) {
  const { id } = await params;
  if (!id) redirect("/host/listings");

  const user = await getOrCreateServerUser();
  if (!user) redirect("/login?next=/host/listings/" + encodeURIComponent(id) + "/approved-edit");

  const listing = await findHostListingForEdit(id, user.id);
  if (!listing) redirect("/host/listings");
  if (listing.status !== "APPROVED") redirect("/host/listings/" + encodeURIComponent(id) + "/edit");

  const title = (listing.title ?? listing.titleKo ?? "").trim() || "(제목 없음)";

  return (
    <div className="mx-auto max-w-2xl rounded-3xl border border-neutral-200 bg-white p-8 shadow-sm">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">승인된 숙소 일부 수정</h1>
          <p className="mt-1 text-sm text-neutral-600">{title}</p>
        </div>
        <Link
          href="/host/listings"
          className="rounded-2xl border border-neutral-200 px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
        >
          목록으로
        </Link>
      </div>
      <p className="mb-6 text-sm text-neutral-500">
        승인된 숙소는 체크인 안내, 이용 규칙, 상세 주소만 수정할 수 있습니다.
      </p>
      <ApprovedListingEditForm
        listingId={id}
        initialCheckInGuideMessage={listing.checkInGuideMessage ?? ""}
        initialHouseRulesMessage={listing.houseRulesMessage ?? ""}
        initialDetailedAddress={listing.detailedAddress ?? ""}
      />
    </div>
  );
}
