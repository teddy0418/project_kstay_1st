import { redirect } from "next/navigation";

type Props = { params: Promise<{ id: string }> };

export default async function HostListingEditPage({ params }: Props) {
  const { id } = await params;
  if (!id) redirect("/host/listings");
  redirect(`/host/listings/new/${encodeURIComponent(id)}/basics`);
}
