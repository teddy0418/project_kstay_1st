import { redirect } from "next/navigation";
import { getOrCreateServerUser } from "@/lib/auth/server";
import { findListingMinimalForWizardStep } from "@/lib/repositories/host-listings";
import { getFirstIncompleteStep } from "@/features/host/listings/wizard-steps";
import type { WizardListing } from "@/features/host/listings/ListingWizardContext";

type Props = { params: Promise<{ id: string }> };

export default async function HostListingEditPage({ params }: Props) {
  const { id } = await params;
  if (!id) redirect("/host/listings");

  const user = await getOrCreateServerUser();
  if (!user) redirect("/login?next=/host/listings/" + encodeURIComponent(id) + "/edit");
  const listing = await findListingMinimalForWizardStep(id, user.id);
  if (!listing) redirect("/host/listings");

  const step = getFirstIncompleteStep(listing as WizardListing);
  redirect(`/host/listings/new/${encodeURIComponent(id)}/${step}`);
}
