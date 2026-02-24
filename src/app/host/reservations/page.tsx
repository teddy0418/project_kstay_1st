import { redirect } from "next/navigation";
import { getCurrentHostFlow } from "@/lib/host/server";

export default async function HostReservationsPage() {
  const current = await getCurrentHostFlow();
  if (!current) redirect("/login?next=/host/reservations");

  if (current.status === "NONE") redirect("/host/onboarding");
  if (current.status === "DRAFT") redirect("/host/listings");
  if (current.status === "PENDING") redirect("/host/pending");

  return (
    <div className="rounded-3xl border border-neutral-200 bg-white shadow-sm p-8">
      <div className="text-2xl font-extrabold tracking-tight">예약 내역</div>
      <p className="mt-2 text-sm text-neutral-600">예약 리스트/상세/다운로드 영역 (MVP)</p>
    </div>
  );
}
