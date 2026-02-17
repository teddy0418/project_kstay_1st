import { Suspense } from "react";
import Header from "@/components/layout/Header";
import FloatingSearch from "@/components/layout/FloatingSearch";
import BottomNav from "@/components/layout/BottomNav";

export default function GuestLayout({ children }: { children: React.ReactNode }) {
  console.log("[KSTAY:server] 2. GuestLayout render (Header → FloatingSearch → children → BottomNav)");
  return (
    <>
      <Header />
      <Suspense fallback={<div className="h-14 border-b border-neutral-200" />}>
        <FloatingSearch />
      </Suspense>
      <div className="pb-24 md:pb-0">{children}</div>
      <BottomNav />
    </>
  );
}
