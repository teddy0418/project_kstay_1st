import { redirect } from "next/navigation";
import { getCurrentHostFlow } from "@/lib/host/server";

export default async function HostIndexPage() {
  const current = await getCurrentHostFlow();
  if (!current) redirect("/login?next=/host");

  if (current.status === "NONE") redirect("/host/onboarding");
  if (current.status === "DRAFT") redirect("/host/listings");
  if (current.status === "PENDING") redirect("/host/pending");

  redirect("/host/dashboard");
}
