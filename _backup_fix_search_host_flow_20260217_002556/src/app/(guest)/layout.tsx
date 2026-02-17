import Header from "@/components/layout/Header";
import BottomNav from "@/components/layout/BottomNav";
import FloatingSearch from "@/components/layout/FloatingSearch";

export default function GuestLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header />
      <div className="relative z-30">
        <FloatingSearch />
      </div>
      {children}
      <BottomNav />
    </>
  );
}
