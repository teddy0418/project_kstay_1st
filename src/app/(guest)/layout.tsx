import Header from "@/components/layout/Header";
import BottomNav from "@/components/layout/BottomNav";
import FloatingSearchWrapper from "@/components/layout/FloatingSearchWrapper";

export default function GuestLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header />
      <div className="relative z-40">
        <FloatingSearchWrapper />
      </div>
      {children}
      <BottomNav />
    </>
  );
}
