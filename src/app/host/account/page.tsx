export default function HostAccountPage() {
  return (
    <div className="rounded-3xl border border-neutral-200 bg-white shadow-sm p-8">
      <div className="text-2xl font-extrabold tracking-tight">계정 관리</div>
      <p className="mt-2 text-sm text-neutral-600">
        (MVP) 여기에서 파트너 정보 / 정산 계좌 / 연락처 등을 관리하게 됩니다.
      </p>

      <div className="mt-6 grid gap-3 text-sm text-neutral-700">
        <div className="rounded-2xl border border-neutral-200 bg-[#F9FAFB] p-4">
          프로필(사업자/대표자명) · 연락처 · 정산 계좌번호 · 알림 설정
        </div>
        <div className="rounded-2xl border border-neutral-200 bg-[#F9FAFB] p-4">
          다음 단계에서 DB(Supabase/Prisma) 연결 후 실제 저장되도록 구현합니다.
        </div>
      </div>
    </div>
  );
}
