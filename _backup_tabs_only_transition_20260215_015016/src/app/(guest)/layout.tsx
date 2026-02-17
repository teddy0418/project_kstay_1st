import Header from "@/components/layout/Header";
import BottomNav from "@/components/layout/BottomNav";
import PageTransition from "@/components/ui/PageTransition";
import { Suspense } from "react";
import FloatingSearch from "@/components/layout/FloatingSearch";

export default function GuestLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header />
      <Suspense fallback={<div className="h-14 border-b border-neutral-200" />}>
        <FloatingSearch />
      </Suspense>
      <main className="pb-24 md:pb-0">
        <PageTransition>{children}</PageTransition>
      </main>
      <BottomNav />
    </>
  );
}
