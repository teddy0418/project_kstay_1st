import Header from "@/components/layout/Header";
import FloatingSearch from "@/components/layout/FloatingSearch";
import BottomNav from "@/components/layout/BottomNav";

export default function GuestLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header />
      <FloatingSearch />
      <main className="pb-24">{children}</main>
      <BottomNav />
    </>
  );
}
