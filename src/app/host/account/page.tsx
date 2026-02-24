import { redirect } from "next/navigation";
import { getCurrentHostFlow } from "@/lib/host/server";
import HostAccountClient from "@/features/host/account/HostAccountClient";

export default async function HostAccountPage() {
  const current = await getCurrentHostFlow();
  if (!current) redirect("/login?next=/host/account");
  if (current.status === "NONE") redirect("/host/onboarding");
  if (current.status === "DRAFT") redirect("/host/listings");
  if (current.status === "PENDING") redirect("/host/pending");

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">계정 관리</h1>
        <p className="mt-1 text-sm text-neutral-500">
          정산 계좌를 설정하면 정산 금액이 등록된 계좌로 출금됩니다. 이름·사진은 내 프로필에서 설정한 내용이 숙소 상세에 표시됩니다.
        </p>
      </div>
      <HostAccountClient />
    </div>
  );
}
