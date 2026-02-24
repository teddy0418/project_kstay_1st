import { redirect } from "next/navigation";
import { getCurrentHostFlow } from "@/lib/host/server";
import { getHostListingsForCalendar } from "@/lib/repositories/host-calendar";
import HostCalendarTabs from "@/features/host/calendar/HostCalendarTabs";

export default async function HostCalendarPage() {
  const current = await getCurrentHostFlow();
  if (!current) redirect("/login?next=/host/calendar");
  if (current.status === "NONE") redirect("/host/onboarding");
  if (current.status === "DRAFT") redirect("/host/listings");
  if (current.status === "PENDING") redirect("/host/pending");

  const listings = await getHostListingsForCalendar(current.user.id);
  const now = new Date();
  const firstId = listings[0]?.id ?? null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">캘린더</h1>
        <p className="mt-1 text-sm text-neutral-500">
          통합 달력, 예약 목록, 유동 가격을 한곳에서 관리하세요.
        </p>
      </div>
      <HostCalendarTabs
        listings={listings}
        initialListingId={firstId}
        year={now.getFullYear()}
        month={now.getMonth() + 1}
      />
    </div>
  );
}
