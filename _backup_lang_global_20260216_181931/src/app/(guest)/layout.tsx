import Header from "@/components/layout/Header";
import BottomNav from "@/components/layout/BottomNav";
import LanguageProvider from "@/components/ui/LanguageProvider";
import { CurrencyProvider } from "@/components/ui/CurrencyProvider";
import { ToastProvider } from "@/components/ui/ToastProvider";

export default function GuestLayout({ children }: { children: React.ReactNode }) {
  return (
    <LanguageProvider>
      <CurrencyProvider>
        <ToastProvider>
          <Header />
          <main className="pb-24">
            <div className="mx-auto w-full max-w-[1200px]">{children}</div>
          </main>
          <BottomNav />
        </ToastProvider>
      </CurrencyProvider>
    </LanguageProvider>
  );
}
