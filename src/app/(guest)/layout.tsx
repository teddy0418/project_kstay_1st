import Header from "@/components/layout/Header";
import BottomNav from "@/components/layout/BottomNav";
import FloatingSearchWrapper from "@/components/layout/FloatingSearchWrapper";
import GuestI18nWrapper from "./GuestI18nWrapper";

export default function GuestLayout({ children }: { children: React.ReactNode }) {
  return (
    <GuestI18nWrapper>
      <div className="min-w-0 overflow-x-hidden">
        <Header />
        <div className="relative z-40">
          <FloatingSearchWrapper />
        </div>
        {children}
        <BottomNav />
      </div>
    </GuestI18nWrapper>
  );
}
