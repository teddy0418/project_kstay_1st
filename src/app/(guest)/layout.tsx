import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import BottomNav from "@/components/layout/BottomNav";
import FloatingSearchWrapper from "@/components/layout/FloatingSearchWrapper";
import GuestI18nWrapper from "./GuestI18nWrapper";
import { getServerLang } from "@/lib/i18n/server";

export default async function GuestLayout({ children }: { children: React.ReactNode }) {
  const initialLang = await getServerLang();
  return (
    <GuestI18nWrapper initialLang={initialLang}>
      <div className="min-w-0 overflow-x-hidden pb-20 md:pb-0">
        <Header />
        <div className="relative z-40">
          <FloatingSearchWrapper />
        </div>
        {children}
        <Footer />
        <BottomNav />
      </div>
    </GuestI18nWrapper>
  );
}
