import Link from "next/link";

export default function AdminPage() {
  return (
    <div className="grid gap-6">
      <div className="rounded-2xl border border-neutral-200 bg-white p-6">
        <div className="text-sm font-semibold">Control tower (MVP)</div>
        <p className="mt-2 text-sm text-neutral-600">
          Settlement status + Excel download + pg_tid / settlement_id columns. Next phase.
        </p>
        <div className="mt-4">
          <Link href="/admin/approvals" className="text-sm font-semibold hover:underline">
            Go to host approvals
          </Link>
        </div>
      </div>
    </div>
  );
}
