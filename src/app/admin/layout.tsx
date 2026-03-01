import Link from "next/link";
import { redirect } from "next/navigation";
import AdminCategoryNav from "@/components/admin/AdminCategoryNav";
import { requireAdminUser } from "@/lib/auth/server";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const admin = await requireAdminUser();
  if (!admin) redirect("/");

  return (
    <div className="min-h-screen min-w-0 overflow-x-hidden bg-[#F9FAFB]">
      <div className="sticky top-0 z-40 border-b border-neutral-200 bg-white/95 backdrop-blur">
        <div className="mx-auto w-full max-w-screen-xl px-4">
          <div className="flex h-14 items-center justify-between">
            <Link href="/admin" className="font-extrabold tracking-tight">
              KSTAY <span className="text-rose-600 font-semibold">ADMIN</span>
            </Link>
            <Link
              href="/"
              className="rounded-full border border-neutral-200 bg-white px-4 py-2 text-sm font-semibold text-neutral-700 hover:bg-neutral-50 transition shrink-0"
            >
              게스트 모드로 전환
            </Link>
          </div>
        </div>
      </div>

      <AdminCategoryNav />

      <main className="mx-auto w-full min-w-0 max-w-screen-xl px-4 py-6">{children}</main>
    </div>
  );
}
