import { cookies } from "next/headers";
import Header from "@/components/layout/Header";
import BottomNav from "@/components/layout/BottomNav";
import LanguageProvider, { type Lang } from "@/components/ui/LanguageProvider";
import { CurrencyProvider } from "@/components/ui/CurrencyProvider";
import { ToastProvider } from "@/components/ui/ToastProvider";
import AuthProvider from "@/components/ui/AuthProvider";
import WishlistProvider from "@/components/ui/WishlistProvider";
import type { AuthUser } from "@/components/ui/AuthProvider";

async function langFromCookies(): Promise<Lang> {
  const c = await cookies();
  const raw =
    c.get("kstay_lang")?.value ||
    c.get("kst_lang")?.value ||
    "en";
  return raw === "ko" || raw === "ja" || raw === "zh" ? (raw as Lang) : "en";
}

async function initialUserFromCookies(): Promise<AuthUser | null> {
  const c = await cookies();

  const userJson = c.get("kstay_user")?.value || c.get("kst_user")?.value;
  if (userJson) {
    try {
      const decoded = decodeURIComponent(userJson);
      const obj = JSON.parse(decoded) as Record<string, unknown>;
      if (obj && typeof obj === "object") {
        const id = String(obj.id ?? "user");
        const name = String(obj.name ?? "Guest");
        const role =
          obj.role === "HOST" ? "HOST" : obj.role === "ADMIN" ? "ADMIN" : "GUEST";
        return { id, name, role };
      }
    } catch {}
  }

  const hasSessionCookie =
    !!c.get("__Secure-next-auth.session-token")?.value ||
    !!c.get("next-auth.session-token")?.value ||
    !!c.get("__Secure-authjs.session-token")?.value ||
    !!c.get("authjs.session-token")?.value ||
    !!c.get("kstay_session")?.value ||
    !!c.get("kst_session")?.value;

  if (hasSessionCookie) {
    return { id: "server-session", name: "Guest", role: "GUEST" };
  }

  const flag = c.get("kstay_logged_in")?.value || c.get("kst_logged_in")?.value;
  if (flag === "1" || flag === "true") {
    return { id: "flag-user", name: "Guest", role: "GUEST" };
  }

  return null;
}

export default async function GuestLayout({ children }: { children: React.ReactNode }) {
  const [lang, initialUser] = await Promise.all([langFromCookies(), initialUserFromCookies()]);

  return (
    <LanguageProvider initialLang={lang}>
      <AuthProvider initialUser={initialUser}>
        <WishlistProvider>
          <CurrencyProvider>
            <ToastProvider>
              <Header />
              <main className="pb-24">
                <div className="mx-auto w-full max-w-[1200px]">{children}</div>
              </main>
              <BottomNav />
            </ToastProvider>
          </CurrencyProvider>
        </WishlistProvider>
      </AuthProvider>
    </LanguageProvider>
  );
}
