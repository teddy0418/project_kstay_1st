import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import BottomNav from "@/components/layout/BottomNav";
import GuestI18nWrapper from "./GuestI18nWrapper";
import { getServerLang } from "@/lib/i18n/server";
import GuestTopShell from "./GuestTopShell";

export default async function GuestLayout({ children }: { children: React.ReactNode }) {
  const initialLang = await getServerLang();
  return (
    <GuestI18nWrapper initialLang={initialLang}>
      <div className="min-w-0 overflow-x-hidden pb-20 md:pb-0">
        <GuestTopShell>{children}</GuestTopShell>
        <Footer />
        <BottomNav />
      </div>
    </GuestI18nWrapper>
  );
}
