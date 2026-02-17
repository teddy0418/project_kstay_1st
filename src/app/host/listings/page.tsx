import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentHostFlow } from "@/lib/host/server";

export default async function HostListingsPage() {
  const current = await getCurrentHostFlow();
  if (!current) redirect("/login?next=/host/listings");

  if (current.status === "NONE") redirect("/host/onboarding");
  if (current.status === "PENDING") redirect("/host/pending");

  return (
    <div className="rounded-3xl border border-neutral-200 bg-white shadow-sm p-8">
      <div className="text-2xl font-extrabold tracking-tight">판매 관리</div>
      <p className="mt-2 text-sm text-neutral-600">숙소 정보/가격/판매 상태를 관리합니다. (MVP)</p>

      <div className="mt-6">
        <Link href="/host/listings/new" className="inline-flex rounded-2xl bg-neutral-900 px-6 py-3 text-white text-sm font-semibold hover:opacity-95 transition">
          새 숙소 등록
        </Link>
      </div>
    </div>
  );
}
