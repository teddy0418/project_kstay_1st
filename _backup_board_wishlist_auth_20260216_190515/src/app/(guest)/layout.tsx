import { cookies } from "next/headers";
import Header from "@/components/layout/Header";
import BottomNav from "@/components/layout/BottomNav";
import LanguageProvider, { type Lang } from "@/components/ui/LanguageProvider";
import { CurrencyProvider } from "@/components/ui/CurrencyProvider";
import { ToastProvider } from "@/components/ui/ToastProvider";

async function langFromCookies(): Promise<Lang> {
  const c = await cookies();
  const raw =
    c.get("kstay_lang")?.value ||
    c.get("kst_lang")?.value ||
    "en";

  return raw === "ko" || raw === "ja" || raw === "zh" ? (raw as Lang) : "en";
}

export default async function GuestLayout({ children }: { children: React.ReactNode }) {
  const lang = await langFromCookies();

  return (
    <LanguageProvider initialLang={lang}>
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
