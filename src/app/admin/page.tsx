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
        <h1 className="text-2xl font-extrabold tracking-tight">요약</h1>
        <p className="mt-1 text-sm text-neutral-500">플랫폼 현황을 한눈에 확인하세요.</p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
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
        <p className="mt-1 text-sm text-neutral-500">자주 쓰는 메뉴로 바로 이동합니다.</p>
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Link
            href="/admin/listings?status=PENDING"
            className="rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm font-semibold text-neutral-800 hover:bg-neutral-50 transition text-center block"
          >
            숙소 승인
            {pendingListings.length > 0 && (
              <span className="ml-2 inline-flex items-center justify-center rounded-full bg-amber-100 text-amber-800 text-xs font-bold px-2 py-0.5">
                {pendingListings.length}
              </span>
            )}
          </Link>
          <Link
            href="/admin/bookings"
            className="rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm font-semibold text-neutral-800 hover:bg-neutral-50 transition text-center block"
          >
            예약 관리
          </Link>
          <Link
            href="/admin/settlements"
            className="rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm font-semibold text-neutral-800 hover:bg-neutral-50 transition text-center block"
          >
            정산
          </Link>
          <Link
            href="/admin/test-review"
            className="rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm font-semibold text-neutral-800 hover:bg-neutral-50 transition text-center block"
          >
            테스트 리뷰
          </Link>
        </div>
      </div>

      <div className="rounded-2xl border border-neutral-200 bg-white p-6">
        <h2 className="text-lg font-bold text-neutral-900">메뉴 안내</h2>
        <div className="mt-4 space-y-4 text-sm text-neutral-600">
          <div>
            <h3 className="font-semibold text-neutral-800">운영</h3>
            <ul className="mt-1.5 list-inside list-disc space-y-0.5 pl-1">
              <li><strong>숙소 관리</strong> — 상태별 목록, 승인 대기 건 승인/거절</li>
              <li><strong>예약 관리</strong> — 전체 예약·취소 이력(게스트/호스트 구분)</li>
              <li><strong>정산</strong> — 결제 완료·체크인 24h 경과 건 정산 (PG 연동 시 출금)</li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold text-neutral-800">콘텐츠</h3>
            <ul className="mt-1.5 list-inside list-disc space-y-0.5 pl-1">
              <li><strong>KSTAY Black</strong> — 메인 노출 숙소 선정·순서</li>
              <li><strong>게시판</strong> — 게스트용 게시판 글 관리</li>
              <li><strong>호스트 공지</strong> — 호스트 대시보드 KSTAY 센터 공지·가이드</li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold text-neutral-800">고객·도구</h3>
            <ul className="mt-1.5 list-inside list-disc space-y-0.5 pl-1">
              <li><strong>고객센터</strong> — 문의 티켓 목록·답변</li>
              <li><strong>테스트 리뷰</strong> — 특정 숙소 테스트 리뷰 등록</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
