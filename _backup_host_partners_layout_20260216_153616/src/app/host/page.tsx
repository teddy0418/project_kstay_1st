export default function HostDashboardPage() {
  return (
    <div className="grid gap-6">
      <div className="rounded-2xl border border-neutral-200 bg-white p-6">
        <div className="text-sm font-semibold">0% host fee benefit active</div>
        <p className="mt-2 text-sm text-neutral-600">
          You are currently on 0% host fee. Compared to other platforms you keep more per booking.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-neutral-200 bg-white p-6">
          <div className="text-sm text-neutral-500">Bookings this month</div>
          <div className="mt-2 text-2xl font-semibold">—</div>
        </div>
        <div className="rounded-2xl border border-neutral-200 bg-white p-6">
          <div className="text-sm text-neutral-500">Settlement due</div>
          <div className="mt-2 text-2xl font-semibold">—</div>
        </div>
      </div>
    </div>
  );
}
