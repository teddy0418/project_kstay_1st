import { redirect } from "next/navigation";
import { getCurrentHostFlow } from "@/lib/host/server";

export default async function HostIndexPage() {
  const current = await getCurrentHostFlow();
  if (!current) redirect("/login?next=/host");

  const isHost = current.user.role === "HOST" || current.user.role === "ADMIN";
  if (!isHost) redirect("/login?next=/host");

  if (current.status === "NONE") redirect("/host/onboarding");
  if (current.status === "PENDING") redirect("/host/pending");

  redirect("/host/dashboard");
}
