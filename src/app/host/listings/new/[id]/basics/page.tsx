import { redirect } from "next/navigation";

/** 기본정보 단계 제거: 숙소정보(guide)로 통합되었으므로 /basics 접근 시 /guide로 리다이렉트 */
export default async function WizardBasicsRedirect({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (!id) redirect("/host/listings");
  redirect(`/host/listings/new/${encodeURIComponent(id)}/guide`);
}
