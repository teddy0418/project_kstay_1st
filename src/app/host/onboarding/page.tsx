import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentHostFlow } from "@/lib/host/server";

export default async function HostOnboardingPage() {
  const current = await getCurrentHostFlow();
  if (!current) redirect("/login?next=/host");
  if (current.status === "PENDING") redirect("/host/pending");
  if (current.status === "APPROVED") redirect("/host/dashboard");

  return (
    <div className="grid gap-6">
      <div className="rounded-3xl border border-neutral-200 bg-white shadow-sm p-8">
        <div className="text-2xl font-extrabold tracking-tight">숙소 등록을 시작해볼까요?</div>
        <p className="mt-3 text-sm text-neutral-600 leading-6">
          KSTAY는 호스트 수수료 0% 정책으로, 불필요한 중개 수수료를 줄여 호스트 수익을 지키는 플랫폼입니다.
          <br />
          먼저 숙소를 등록하면, 운영팀 검토 후 승인 완료 시 파트너스 대시보드를 이용할 수 있어요.
        </p>

        <div className="mt-6 flex flex-col sm:flex-row gap-3">
          <Link
            href="/host/listings/new"
            className="inline-flex items-center justify-center rounded-2xl bg-neutral-900 px-6 py-4 text-white text-sm font-semibold hover:opacity-95 transition"
          >
            숙소 등록하기
          </Link>

          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-2xl border border-neutral-200 bg-white px-6 py-4 text-sm font-semibold hover:bg-neutral-50 transition"
          >
            게스트 모드로 돌아가기
          </Link>
        </div>
      </div>

      <div className="rounded-3xl border border-neutral-200 bg-white shadow-sm p-8">
        <div className="text-lg font-bold">등록 전 체크리스트</div>
        <ul className="mt-3 list-disc pl-5 text-sm text-neutral-600 leading-6">
          <li>숙소 이름 / 주소 / 1박 기본요금</li>
          <li>체크인·체크아웃 시간</li>
          <li>사진 최소 5장 (MVP 기준)</li>
          <li>정산 계좌정보(추후 단계에서 받습니다)</li>
        </ul>
      </div>
    </div>
  );
}
