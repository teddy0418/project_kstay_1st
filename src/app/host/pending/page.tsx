import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentHostFlow } from "@/lib/host/server";

export default async function HostPendingPage() {
  const current = await getCurrentHostFlow();
  if (!current) redirect("/login?next=/host");
  if (current.status === "NONE") redirect("/host/onboarding");
  if (current.status === "DRAFT") redirect("/host/listings");
  if (current.status === "APPROVED") redirect("/host/dashboard");

  return (
    <div className="grid gap-6">
      <div className="rounded-3xl border border-neutral-200 bg-white shadow-sm p-8">
        <div className="text-2xl font-extrabold tracking-tight">숙소 승인을 진행 중입니다</div>
        <p className="mt-3 text-sm text-neutral-600 leading-6">
          등록하신 숙소 정보를 운영팀이 확인하고 있어요.
          <br />
          승인 완료 후부터 파트너스 대시보드(홈/판매/예약/정산)를 이용할 수 있습니다.
        </p>

        <div className="mt-6 flex flex-col sm:flex-row gap-3">
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-2xl border border-neutral-200 bg-white px-6 py-4 text-sm font-semibold hover:bg-neutral-50 transition"
          >
            게스트 모드로 전환
          </Link>
        </div>

        <div className="mt-6 rounded-2xl bg-[#F9FAFB] border border-neutral-200 p-4 text-xs text-neutral-600 leading-5">
          * 실서비스에서는 대표님(관리자)이 어드민에서 승인하면 자동으로 &quot;승인 완료&quot; 상태로 바뀌게 됩니다.
        </div>
      </div>
    </div>
  );
}
