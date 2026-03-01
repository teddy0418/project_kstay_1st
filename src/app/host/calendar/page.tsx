import { redirect } from "next/navigation";
import { getCurrentHostFlow } from "@/lib/host/server";
import { getHostListingsForCalendar, getBlockedDates } from "@/lib/repositories/host-calendar";
import HostCalendarTabs from "@/features/host/calendar/HostCalendarTabs";

type PageProps = { searchParams?: Promise<{ listingId?: string | string[] }> | { listingId?: string | string[] } };

export default async function HostCalendarPage(props: PageProps) {
  const current = await getCurrentHostFlow();
  if (!current) redirect("/login?next=/host/calendar");
  if (current.status === "NONE") redirect("/host/onboarding");
  if (current.status === "DRAFT") redirect("/host/listings");
  if (current.status === "PENDING") redirect("/host/pending");

  const listings = await getHostListingsForCalendar(current.user.id);
  const now = new Date();
  const firstId = listings[0]?.id ?? null;
  const year = now.getFullYear();
  const month = now.getMonth() + 1;

  const raw = props.searchParams;
  const params = raw != null && typeof (raw as Promise<unknown>).then === "function"
    ? await (raw as Promise<{ listingId?: string | string[] }>)
    : (raw as { listingId?: string | string[] }) ?? {};
  const listingIdParam = typeof params.listingId === "string" ? params.listingId : params.listingId?.[0];
  const initialListingId =
    listingIdParam && listings.some((l) => l.id === listingIdParam)
      ? listingIdParam
      : firstId;

  const monthEnd = new Date(year, month, 0);
  const from = new Date(Date.UTC(year, month - 1, 1));
  const to = new Date(Date.UTC(year, month - 1, monthEnd.getDate(), 23, 59, 59, 999));
  const initialBlockedDates =
    initialListingId != null
      ? await getBlockedDates(initialListingId, from, to)
      : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-neutral-900 md:text-2xl">캘린더</h1>
        <p className="mt-1 text-xs text-neutral-500 md:text-sm">
          통합 달력, 예약 목록, 유동 가격을 한곳에서 관리하세요.
        </p>
      </div>
      <HostCalendarTabs
        listings={listings}
        initialListingId={initialListingId}
        initialBlockedDates={initialBlockedDates}
        year={year}
        month={month}
      />
    </div>
  );
}
