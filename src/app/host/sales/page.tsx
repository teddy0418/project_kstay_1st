import Link from "next/link";

export default function HostSalesPage() {
  return (
    <div className="rounded-2xl border border-neutral-200 bg-white shadow-sm p-6">
      <div className="text-lg font-bold">판매 관리</div>
      <div className="mt-1 text-sm text-neutral-500">
        MVP에서는 기본 기능부터 연결합니다. (숙소 등록/캘린더/가격정책)
      </div>
      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        <Link href="/host/listings/new" className="rounded-2xl border border-neutral-200 p-4 hover:bg-neutral-50 transition">
          <div className="text-sm font-semibold">숙소 등록</div>
          <div className="mt-1 text-xs text-neutral-500">새 숙소를 등록하고 판매를 시작합니다.</div>
        </Link>
        <Link href="/host/calendar" className="rounded-2xl border border-neutral-200 p-4 hover:bg-neutral-50 transition">
          <div className="text-sm font-semibold">예약 캘린더</div>
          <div className="mt-1 text-xs text-neutral-500">예약/빈방을 확인하고 막을 수 있습니다.</div>
        </Link>
        <Link href="/host/settlements" className="rounded-2xl border border-neutral-200 p-4 hover:bg-neutral-50 transition">
          <div className="text-sm font-semibold">정산 관리</div>
          <div className="mt-1 text-xs text-neutral-500">화요일 정산 정책 기준으로 정산 현황을 확인합니다.</div>
        </Link>
        <Link href="/" className="rounded-2xl border border-neutral-200 p-4 hover:bg-neutral-50 transition">
          <div className="text-sm font-semibold">게스트 화면 미리보기</div>
          <div className="mt-1 text-xs text-neutral-500">게스트에게 보이는 화면을 확인합니다.</div>
        </Link>
      </div>
    </div>
  );
}
