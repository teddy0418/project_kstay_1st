"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Globe,
  Menu,
  Home,
  MapPin,
  CheckCircle2,
  LogOut,
  Heart,
  MessageCircle,
  User,
  Building2,
  Shield,
  HelpCircle,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import Container from "@/components/layout/Container";
import AccountIndicator from "@/components/layout/AccountIndicator";
import { cn } from "@/lib/utils";
import { useCurrency } from "@/components/ui/CurrencyProvider";
import { useToast } from "@/components/ui/ToastProvider";
import { useI18n } from "@/components/ui/LanguageProvider";
import { useAuthModal } from "@/components/ui/auth/AuthModalProvider";
import { useAuth } from "@/components/ui/AuthProvider";

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { currency, setCurrency, supported } = useCurrency();
  const { toast } = useToast();
  const { t, lang, setLang, options } = useI18n();
  const { open: openAuthModal } = useAuthModal();
  const { user, isAuthed } = useAuth();

  const [openMenu, setOpenMenu] = useState(false);
  const [openLang, setOpenLang] = useState(false);

  const menuRef = useRef<HTMLDivElement | null>(null);
  const langRef = useRef<HTMLDivElement | null>(null);

  const role = user?.role?.toLowerCase() ?? null;
  const loggedIn = isAuthed;
  const isHost = role === "host" || role === "admin";
  const isAdmin = role === "admin";

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      const tNode = e.target as Node;
      if (menuRef.current && !menuRef.current.contains(tNode)) setOpenMenu(false);
      if (langRef.current && !langRef.current.contains(tNode)) setOpenLang(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  const isBoard = pathname.startsWith("/board");
  const activeIndex = isBoard ? 1 : 0;

  const toRole = (r: string): "GUEST" | "HOST" | "ADMIN" =>
    r === "host" ? "HOST" : r === "admin" ? "ADMIN" : "GUEST";

  const guard = (nextPath: string, desiredRole: "guest" | "host" | "admin" = "guest") => {
    if (!loggedIn) {
      openAuthModal({ next: nextPath, role: toRole(desiredRole) });
      return;
    }
    router.push(nextPath);
    setOpenMenu(false);
  };

  const guardHost = () => {
    if (!isHost) {
      openAuthModal({ next: "/host", role: "HOST" });
      return;
    }
    router.push("/host");
    setOpenMenu(false);
  };

  return (
    <header className="sticky top-0 z-[90] border-b border-neutral-200 bg-white/85 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <Container className="flex h-[76px] items-center justify-between gap-3">
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <div className="h-10 w-10 rounded-xl bg-brand text-brand-foreground grid place-items-center font-semibold">
            K
          </div>
          <div className="hidden sm:block leading-tight">
            <div className="text-sm font-semibold tracking-tight">KSTAY</div>
            <div className="text-xs text-neutral-500">the best value for your k-stay</div>
          </div>
        </Link>

        <div className="flex flex-1 justify-center">
          <div className="relative grid grid-cols-2 rounded-full border border-neutral-200 bg-white p-1 shadow-soft min-w-[210px]">
            <span
              className={cn(
                "absolute inset-y-1 left-1 w-[calc(50%-4px)] rounded-full bg-neutral-900",
                "transition-transform duration-200 ease-out",
                activeIndex === 1 && "translate-x-full"
              )}
              aria-hidden
            />

            <Link
              href="/"
              className={cn(
                "relative z-10 inline-flex items-center justify-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-colors",
                activeIndex === 0 ? "text-white" : "text-neutral-700 hover:bg-neutral-50"
              )}
            >
              <Home className="h-4 w-4" />
              {t("stays")}
            </Link>

            <Link
              href="/board"
              className={cn(
                "relative z-10 inline-flex items-center justify-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-colors",
                activeIndex === 1 ? "text-white" : "text-neutral-700 hover:bg-neutral-50"
              )}
            >
              <MapPin className="h-4 w-4" />
              {t("board")}
            </Link>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <AccountIndicator />
          <div className="relative" ref={langRef}>
            <button
              type="button"
              onClick={() => setOpenLang((v) => !v)}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full hover:bg-neutral-100 transition"
              aria-label="Language & currency"
            >
              <Globe className="h-5 w-5" />
            </button>

            {openLang && (
              <div className="absolute right-0 mt-2 z-[100] w-64 rounded-2xl border border-neutral-200 bg-white shadow-elevated overflow-hidden">
                <div className="px-4 py-3 text-xs font-semibold text-neutral-500">{t("language").toUpperCase()}</div>
                {options.map((o) => (
                  <button
                    key={o.code}
                    type="button"
                    onClick={() => {
                      setLang(o.code);
                      toast(`${o.nativeLabel}`);
                      setOpenLang(false);
                    }}
                    className="w-full text-left px-4 py-3 text-sm hover:bg-neutral-50 flex items-center justify-between"
                  >
                    <span>{o.nativeLabel}</span>
                    {lang === o.code && <CheckCircle2 className="h-4 w-4 text-brand" />}
                  </button>
                ))}

                <div className="h-px bg-neutral-200" />

                <div className="px-4 py-3 text-xs font-semibold text-neutral-500">{t("currency").toUpperCase()}</div>
                {supported.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => {
                      setCurrency(c);
                      toast(`Currency: ${c}`);
                      setOpenLang(false);
                    }}
                    className="w-full text-left px-4 py-3 text-sm hover:bg-neutral-50 flex items-center justify-between"
                  >
                    <span>{c}</span>
                    {currency === c && <CheckCircle2 className="h-4 w-4 text-brand" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="relative" ref={menuRef}>
            <button
              type="button"
              onClick={() => setOpenMenu((v) => !v)}
              className="inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-white px-3 py-2 shadow-soft hover:shadow-elevated transition"
              aria-label="Menu"
            >
              <Menu className="h-5 w-5" />
              <span className="hidden sm:inline text-sm font-semibold">{t("menu")}</span>
            </button>

            {openMenu && (
              <div className="absolute right-0 mt-2 z-[100] w-64 rounded-2xl border border-neutral-200 bg-white shadow-elevated overflow-hidden">
                {!loggedIn ? (
                  <button
                    type="button"
                    onClick={() => {
                      openAuthModal({ next: pathname || "/", role: "GUEST" });
                      setOpenMenu(false);
                    }}
                    className="w-full text-left px-4 py-3 text-sm font-semibold hover:bg-neutral-50"
                  >
                    {t("login_signup")}
                  </button>
                ) : (
                  <div className="px-4 py-3 text-xs text-neutral-500">{t("signed_in")}</div>
                )}

                <div className="h-px bg-neutral-200" />

                <button
                  type="button"
                  onClick={() => {
                    router.push("/help");
                    setOpenMenu(false);
                  }}
                  className="w-full text-left px-4 py-3 text-sm hover:bg-neutral-50 flex items-center gap-2"
                >
                  <HelpCircle className="h-4 w-4" />
                  {t("help_center")}
                </button>

                <div className="h-px bg-neutral-200" />

                <button
                  type="button"
                  onClick={() => guard("/wishlist", "guest")}
                  className="w-full text-left px-4 py-3 text-sm hover:bg-neutral-50 flex items-center gap-2"
                >
                  <Heart className="h-4 w-4" />
                  {t("wishlist")}
                </button>
                <button
                  type="button"
                  onClick={() => guard("/messages", "guest")}
                  className="w-full text-left px-4 py-3 text-sm hover:bg-neutral-50 flex items-center gap-2"
                >
                  <MessageCircle className="h-4 w-4" />
                  {t("messages")}
                </button>
                <button
                  type="button"
                  onClick={() => guard("/profile", "guest")}
                  className="w-full text-left px-4 py-3 text-sm hover:bg-neutral-50 flex items-center gap-2"
                >
                  <User className="h-4 w-4" />
                  {t("profile")}
                </button>

                <div className="h-px bg-neutral-200" />

                <button
                  type="button"
                  onClick={guardHost}
                  className="w-full text-left px-4 py-3 text-sm hover:bg-neutral-50 flex items-center gap-2"
                >
                  <Building2 className="h-4 w-4" />
                  {t("host_partners")}
                </button>

                {isAdmin && (
                  <button
                    type="button"
                    onClick={() => guard("/admin", "admin")}
                    className="w-full text-left px-4 py-3 text-sm hover:bg-neutral-50 flex items-center gap-2"
                  >
                    <Shield className="h-4 w-4" />
                    {t("admin")}
                  </button>
                )}

                {loggedIn && (
                  <>
                    <div className="h-px bg-neutral-200" />
                    <a
                      href="/logout"
                      className="block px-4 py-3 text-sm hover:bg-neutral-50 flex items-center gap-2"
                      onClick={() => setOpenMenu(false)}
                    >
                      <LogOut className="h-4 w-4" />
                      {t("logout")}
                    </a>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </Container>
    </header>
  );
}
