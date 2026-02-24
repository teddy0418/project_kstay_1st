import Link from "next/link";
import { redirect } from "next/navigation";
import { requireAdminUser } from "@/lib/auth/server";
import { getPendingApprovalItems } from "@/lib/repositories/admin-approvals";
import { prisma } from "@/lib/db";

export default async function AdminPage() {
  const admin = await requireAdminUser();
  if (!admin) redirect("/");

  const [pendingListings, hostCount, approvedListingCount] = await Promise.all([
    getPendingApprovalItems(),
    prisma.user.count({ where: { role: "HOST" } }),
    prisma.listing.count({ where: { status: "APPROVED" } }),
  ]);

  const summary = [
    { label: "호스트 수", value: hostCount.toString() },
    { label: "승인된 숙소", value: approvedListingCount.toString() },
    { label: "승인 대기", value: pendingListings.length.toString(), highlight: pendingListings.length > 0 },
  ];

  return (
    <div className="grid gap-6">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">요약</h1>
        <p className="mt-1 text-sm text-neutral-500">플랫폼 현황을 한눈에 확인하세요</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {summary.map((s) => (
          <div
            key={s.label}
            className={`rounded-2xl border bg-white p-4 shadow-sm ${
              s.highlight ? "border-amber-200 bg-amber-50/50" : "border-neutral-200"
            }`}
          >
            <div className="text-xs text-neutral-500">{s.label}</div>
            <div className={`mt-2 text-xl font-extrabold ${s.highlight ? "text-amber-700" : "text-neutral-900"}`}>
              {s.value}
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-neutral-200 bg-white p-6">
        <h2 className="text-lg font-bold text-neutral-900">빠른 작업</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Link
            href="/admin/listings?status=PENDING"
            className="rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm font-semibold hover:bg-neutral-50 transition text-center block"
          >
            호스트 숙소 승인
            {pendingListings.length > 0 && (
              <span className="ml-2 inline-flex items-center justify-center rounded-full bg-amber-100 text-amber-800 text-xs font-bold px-2 py-0.5">
                {pendingListings.length}
              </span>
            )}
          </Link>
          <Link
            href="/admin/bookings"
            className="rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm font-semibold hover:bg-neutral-50 transition text-center block"
          >
            예약 관리
          </Link>
          <Link
            href="/admin/settlements"
            className="rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm font-semibold hover:bg-neutral-50 transition text-center block"
          >
            정산 관리
          </Link>
          <Link
            href="/admin/test-review"
            className="rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm font-semibold hover:bg-neutral-50 transition text-center block"
          >
            테스트 리뷰
          </Link>
        </div>
      </div>

      <div className="rounded-2xl border border-neutral-200 bg-white p-6">
        <h2 className="text-lg font-bold text-neutral-900">안내</h2>
        <ul className="mt-3 space-y-2 text-sm text-neutral-600">
          <li>· <strong>숙소 관리</strong>: 전체 숙소 목록을 상태별로 보고, 승인 대기 건은 승인/거절합니다.</li>
          <li>· <strong>예약 관리</strong>: 플랫폼 전체 예약 목록을 확인합니다.</li>
          <li>· <strong>정산</strong>: 결제 완료·체크인 기준으로 정산 가능 건을 확인하고 (추후 포트원 연동) 출금합니다.</li>
          <li>· <strong>테스트 리뷰</strong>: 특정 숙소에 테스트용 리뷰를 등록할 수 있습니다.</li>
        </ul>
      </div>
    </div>
  );
}
