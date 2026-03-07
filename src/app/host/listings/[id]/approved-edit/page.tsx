import { redirect } from "next/navigation";
import Link from "next/link";
import { getOrCreateServerUser } from "@/lib/auth/server";
import { findHostListingForEdit, listingHasAnyConfirmedBooking } from "@/lib/repositories/host-listings";
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

  const hasConfirmed = await listingHasAnyConfirmedBooking(id);
  const canEditAddress = !hasConfirmed;

  const title = (listing.title ?? listing.titleKo ?? "").trim() || "(제목 없음)";
  const images = (listing.images ?? []).map((img) => ({
    id: img.id,
    url: img.url,
    sortOrder: img.sortOrder,
  }));

  return (
    <div className="mx-auto max-w-2xl rounded-3xl border border-neutral-200 bg-white p-8 shadow-sm">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">승인된 숙소 수정</h1>
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
        숙소 이름·사진은 언제든 수정할 수 있습니다. 주소는 첫 예약 전에만 변경 가능합니다.
      </p>
      <ApprovedListingEditForm
        listingId={id}
        initialTitle={(listing.title ?? "").trim()}
        initialTitleKo={(listing.titleKo ?? listing.title ?? "").trim()}
        initialHostBioKo={(listing.hostBioKo ?? listing.hostBio ?? "").trim()}
        initialCheckInTime={listing.checkInTime ?? "15:00"}
        initialCheckOutTime={listing.checkOutTime ?? "11:00"}
        initialAmenities={Array.isArray(listing.amenities) ? listing.amenities : []}
        initialAddress={listing.address ?? ""}
        initialCity={listing.city ?? ""}
        initialArea={listing.area ?? ""}
        initialRoadAddress={listing.roadAddress ?? ""}
        initialLat={listing.lat ?? null}
        initialLng={listing.lng ?? null}
        initialCheckInGuideMessage={listing.checkInGuideMessage ?? ""}
        initialHouseRulesMessage={listing.houseRulesMessage ?? ""}
        initialDetailedAddress={listing.detailedAddress ?? ""}
        initialImages={images}
        canEditAddress={canEditAddress}
      />
    </div>
  );
}
