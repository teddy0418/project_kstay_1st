import Link from "next/link";
import HostCategoryNav from "@/components/host/HostCategoryNav";
import HostTopRightMenus from "@/components/host/HostTopRightMenus";
import { getCurrentHostFlow } from "@/lib/host/server";

export default async function HostLayout({ children }: { children: React.ReactNode }) {
  const current = await getCurrentHostFlow();
  const approved = current?.status === "APPROVED";

  return (
    <div className="min-h-screen min-w-0 overflow-x-hidden bg-[#F9FAFB]">
      <div className="sticky top-0 z-40 border-b border-neutral-200 bg-white/95 backdrop-blur">
        <div className="mx-auto w-full max-w-screen-xl px-2 sm:px-4 min-w-0">
          <div className="flex flex-wrap h-14 items-center justify-between gap-1 sm:gap-2">
            <Link href="/host" className="font-extrabold tracking-tight shrink-0 text-sm sm:text-base">KSTAY <span className="text-neutral-500 font-semibold">PARTNERS</span></Link>
            {approved ? <div className="flex min-w-0 shrink items-center gap-0 sm:gap-1"><HostTopRightMenus /></div> : null}
          </div>
        </div>
      </div>

      {approved ? <HostCategoryNav /> : null}

      <main className="mx-auto w-full min-w-0 max-w-screen-xl px-2 sm:px-4 py-4 sm:py-6">{children}</main>
    </div>
  );
}
