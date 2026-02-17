import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { HOST_STATUS_COOKIE, normalizeHostStatus } from "@/lib/hostStatus";

export default async function HostIndexPage() {
  const c = await cookies();
  const status = normalizeHostStatus(c.get(HOST_STATUS_COOKIE)?.value);

  if (status === "NONE") redirect("/host/onboarding");
  if (status === "PENDING") redirect("/host/pending");

  redirect("/host/dashboard");
}
