import Link from "next/link";
import HostTopRightMenus from "@/components/host/HostTopRightMenus";
import { getCurrentHostFlow } from "@/lib/host/server";

export default async function HostLayout({ children }: { children: React.ReactNode }) {
  const current = await getCurrentHostFlow();
  const approved = current?.status === "APPROVED";

  return (
    <div className="min-h-screen bg-[#F9FAFB]">
      <div className="sticky top-0 z-40 border-b border-neutral-200 bg-white/85 backdrop-blur">
        <div className="mx-auto max-w-[1200px] px-4">
          <div className="h-16 flex items-center justify-between">
            <Link href="/host" className="font-extrabold tracking-tight">
              KSTAY <span className="text-neutral-500 font-semibold">PARTNERS</span>
            </Link>

            {approved ? (
              <nav className="hidden md:flex items-center gap-6 text-sm font-semibold text-neutral-700">
                <Link href="/host/dashboard" className="hover:text-neutral-900">
                  홈
                </Link>
                <Link href="/host/listings" className="hover:text-neutral-900">
                  판매 관리
                </Link>
                <Link href="/host/reservations" className="hover:text-neutral-900">
                  예약 내역
                </Link>
                <Link href="/host/settlements" className="hover:text-neutral-900">
                  정산 관리
                </Link>
              </nav>
            ) : (
              <div />
            )}

            <HostTopRightMenus />
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-[1200px] px-4 py-6">{children}</main>
    </div>
  );
}
