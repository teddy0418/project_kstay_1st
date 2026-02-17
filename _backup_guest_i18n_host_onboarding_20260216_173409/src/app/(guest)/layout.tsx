import { Suspense } from "react";
import Header from "@/components/layout/Header";
import FloatingSearch from "@/components/layout/FloatingSearch";
import BottomNav from "@/components/layout/BottomNav";

export default function GuestLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header />
      <Suspense fallback={null}>
        <FloatingSearch />
      </Suspense>
      <main className="pb-24">
        <div className="mx-auto w-full max-w-[1200px]">{children}</div>
      </main>
      <BottomNav />
    </>
  );
}
