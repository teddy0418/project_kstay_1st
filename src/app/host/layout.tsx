import Link from "next/link";
import HostCategoryNav from "@/components/host/HostCategoryNav";
import HostTopRightMenus from "@/components/host/HostTopRightMenus";
import { getCurrentHostFlow } from "@/lib/host/server";

export default async function HostLayout({ children }: { children: React.ReactNode }) {
  const current = await getCurrentHostFlow();
  const approved = current?.status === "APPROVED";

  return (
    <div className="min-h-screen bg-[#F9FAFB]">
      <div className="sticky top-0 z-40 border-b border-neutral-200 bg-white/95 backdrop-blur">
        <div className="mx-auto max-w-[1200px] px-4">
          <div className="flex h-14 items-center justify-between">
            <Link href="/host" className="font-extrabold tracking-tight">
              KSTAY <span className="text-neutral-500 font-semibold">PARTNERS</span>
            </Link>
            {approved ? <HostTopRightMenus /> : null}
          </div>
        </div>
      </div>

      {approved ? <HostCategoryNav /> : null}

      <main className="mx-auto max-w-[1200px] px-4 py-6">{children}</main>
    </div>
  );
}
