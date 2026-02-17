"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Globe, Menu, Home, MapPin, CheckCircle2, LogOut } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import Container from "@/components/layout/Container";
import { cn } from "@/lib/utils";
import { useCurrency } from "@/components/ui/CurrencyProvider";
import { useToast } from "@/components/ui/ToastProvider";
import { ROLE_COOKIE } from "@/lib/auth/session";

function getCookie(name: string) {
  if (typeof document === "undefined") return null;
  const v = document.cookie
    .split("; ")
    .find((row) => row.startsWith(name + "="))
    ?.split("=")[1];
  return v ? decodeURIComponent(v) : null;
}

export default function Header() {
  const pathname = usePathname();
  const { currency, setCurrency, supported } = useCurrency();
  const { toast } = useToast();

  const [openMenu, setOpenMenu] = useState(false);
  const [openLang, setOpenLang] = useState(false);
  const [role, setRole] = useState<string | null>(null);

  const menuRef = useRef<HTMLDivElement | null>(null);
  const langRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    queueMicrotask(() => setRole(getCookie(ROLE_COOKIE)));
  }, []);

  useEffect(() => {
    if (!openMenu) return;
    queueMicrotask(() => setRole(getCookie(ROLE_COOKIE)));
  }, [openMenu]);

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      const t = e.target as Node;
      if (menuRef.current && !menuRef.current.contains(t)) setOpenMenu(false);
      if (langRef.current && !langRef.current.contains(t)) setOpenLang(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  const staysActive =
    pathname === "/" ||
    pathname.startsWith("/browse") ||
    pathname.startsWith("/listings") ||
    pathname.startsWith("/checkout");

  const boardActive = pathname.startsWith("/board");

  return (
    <header className="sticky top-0 z-50 border-b border-neutral-200 bg-white/85 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <Container className="flex h-[76px] items-center justify-between gap-3">
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <div className="h-10 w-10 rounded-xl bg-brand text-brand-foreground grid place-items-center font-semibold">
            K
          </div>
          <div className="hidden sm:block leading-tight">
            <div className="text-sm font-semibold tracking-tight">KSTAY</div>
            <div className="text-xs text-neutral-500">
              the best value for your k-stay
            </div>
          </div>
        </Link>

        <div className="flex flex-1 justify-center">
          <div className="inline-flex rounded-full border border-neutral-200 bg-white p-1 shadow-soft">
            <Link
              href="/"
              className={cn(
                "inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition",
                staysActive
                  ? "bg-neutral-900 text-white"
                  : "text-neutral-700 hover:bg-neutral-50"
              )}
            >
              <Home className="h-4 w-4" />
              Stays
            </Link>
            <Link
              href="/board"
              className={cn(
                "inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition",
                boardActive
                  ? "bg-neutral-900 text-white"
                  : "text-neutral-700 hover:bg-neutral-50"
              )}
            >
              <MapPin className="h-4 w-4" />
              Board
            </Link>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
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
              <div className="absolute right-0 mt-2 w-56 rounded-2xl border border-neutral-200 bg-white shadow-elevated overflow-hidden">
                <div className="px-4 py-3 text-xs font-semibold text-neutral-500">
                  LANGUAGE
                </div>
                <button
                  type="button"
                  onClick={() =>
                    toast("Language selection will be added next. (EN default)")
                  }
                  className="w-full text-left px-4 py-3 text-sm hover:bg-neutral-50"
                >
                  English (default)
                </button>

                <div className="h-px bg-neutral-200" />

                <div className="px-4 py-3 text-xs font-semibold text-neutral-500">
                  CURRENCY
                </div>
                {supported.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => {
                      setCurrency(c);
                      toast(`Currency set to ${c}`);
                      setOpenLang(false);
                    }}
                    className="w-full text-left px-4 py-3 text-sm hover:bg-neutral-50 flex items-center justify-between"
                  >
                    <span>{c}</span>
                    {currency === c && (
                      <CheckCircle2 className="h-4 w-4 text-brand" />
                    )}
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
              <span className="hidden sm:inline text-sm font-semibold">
                Menu
              </span>
            </button>

            {openMenu && (
              <div className="absolute right-0 mt-2 w-64 rounded-2xl border border-neutral-200 bg-white shadow-elevated overflow-hidden">
                <div className="px-4 py-3 text-xs font-semibold text-neutral-500">
                  {role ? `SESSION: ${role}` : "SESSION: none"}
                </div>

                <Link
                  href="/auth"
                  className="block px-4 py-3 text-sm font-semibold hover:bg-neutral-50"
                  onClick={() => setOpenMenu(false)}
                >
                  Log in / Sign up
                </Link>

                <div className="h-px bg-neutral-200" />

                <Link
                  href="/wishlist"
                  className="block px-4 py-3 text-sm hover:bg-neutral-50"
                  onClick={() => setOpenMenu(false)}
                >
                  Wishlist
                </Link>
                <Link
                  href="/messages"
                  className="block px-4 py-3 text-sm hover:bg-neutral-50"
                  onClick={() => setOpenMenu(false)}
                >
                  Messages
                </Link>
                <Link
                  href="/profile"
                  className="block px-4 py-3 text-sm hover:bg-neutral-50"
                  onClick={() => setOpenMenu(false)}
                >
                  Profile
                </Link>

                <div className="h-px bg-neutral-200" />

                <Link
                  href="/host"
                  className="block px-4 py-3 text-sm hover:bg-neutral-50"
                  onClick={() => setOpenMenu(false)}
                >
                  Host Partners
                </Link>
                <Link
                  href="/admin"
                  className="block px-4 py-3 text-sm hover:bg-neutral-50"
                  onClick={() => setOpenMenu(false)}
                >
                  Admin
                </Link>

                <div className="h-px bg-neutral-200" />

                <a
                  href="/auth/logout"
                  className="block px-4 py-3 text-sm hover:bg-neutral-50 flex items-center gap-2"
                  onClick={() => setOpenMenu(false)}
                >
                  <LogOut className="h-4 w-4" />
                  Log out
                </a>
              </div>
            )}
          </div>
        </div>
      </Container>
    </header>
  );
}
