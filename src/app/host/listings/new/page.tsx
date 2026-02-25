import { redirect } from "next/navigation";
import { getOrCreateServerUser } from "@/lib/auth/server";
import { createPendingHostListing, findFirstDraftListingId } from "@/lib/repositories/host-listings";

/** 서버에서 초안 생성 후 기본정보 단계로 리다이렉트 (클라이언트 세션/API 의존 제거) */
export default async function HostListingsNewEntryPage() {
  const user = await getOrCreateServerUser();
  if (!user) redirect("/login?next=/host/listings/new");

  const existingDraftId = await findFirstDraftListingId(user.id);
  if (existingDraftId) {
    redirect(`/host/listings/new/${existingDraftId}/location`);
  }

  const listing = await createPendingHostListing({
    userId: user.id,
    userName: user.name,
    isAdmin: user.role === "ADMIN",
    title: "신규 숙소",
    titleKo: "신규 숙소",
    city: "Seoul",
    area: "Jongno",
    address: "주소를 입력해 주세요",
    basePriceKrw: 100000,
    checkInTime: "15:00",
    checkOutTime: "11:00",
    hostBio: null,
    hostBioKo: null,
    hostBioJa: null,
    hostBioZh: null,
    status: "DRAFT",
  });

  redirect(`/host/listings/new/${listing.id}/location`);
}
