"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Bell, Mail, User, ChevronDown, LogOut, Home, Tags, CalendarDays, CreditCard } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

const NAV = [
  { label: "홈", href: "/host", icon: Home },
  { label: "판매 관리", href: "/host/sales", icon: Tags },
  { label: "예약 내역", href: "/host/reservations", icon: CalendarDays },
  { label: "정산 관리", href: "/host/settlements", icon: CreditCard },
] as const;

function pageTitle(pathname: string) {
  if (pathname === "/host") return "DASHBOARD";
  if (pathname.startsWith("/host/sales")) return "판매 관리";
  if (pathname.startsWith("/host/reservations")) return "예약 내역";
  if (pathname.startsWith("/host/settlements")) return "정산 관리";
  if (pathname.startsWith("/host/messages")) return "메시지";
  if (pathname.startsWith("/host/notifications")) return "알림";
  if (pathname.startsWith("/host/listings")) return "판매 관리";
  if (pathname.startsWith("/host/calendar")) return "예약 내역";
  return "KSTAY PARTNERS";
}

function isActive(pathname: string, href: string) {
  if (href === "/host") return pathname === "/host";
  return pathname.startsWith(href);
}

export default function HostShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const title = useMemo(() => pageTitle(pathname), [pathname]);
  const [openProfile, setOpenProfile] = useState(false);
  const profileRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      const t = e.target as Node;
      if (profileRef.current && !profileRef.current.contains(t)) setOpenProfile(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpenProfile(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  return (
    <div className="min-h-screen bg-[#F9FAFB] text-neutral-900">
      <div className="sticky top-0 z-[90] bg-white">
        <div className="border-b border-neutral-200">
          <div className="mx-auto w-full max-w-[1200px] px-4">
            <div className="flex h-[64px] items-center justify-between gap-4">
              <Link href="/host" className="flex items-center gap-3 shrink-0">
                <div className="h-10 w-10 rounded-xl bg-neutral-900 text-white grid place-items-center font-semibold">K</div>
                <div className="leading-tight">
                  <div className="text-sm font-semibold tracking-tight">KSTAY PARTNERS</div>
                  <div className="text-xs text-neutral-500">호스트 운영 센터</div>
                </div>
              </Link>
              <nav className="hidden md:flex items-center gap-1 rounded-full border border-neutral-200 bg-white p-1 shadow-sm">
                {NAV.map((n) => {
                  const active = isActive(pathname, n.href);
                  const Icon = n.icon;
                  return (
                    <Link
                      key={n.href}
                      href={n.href}
                      className={["inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition", active ? "bg-neutral-900 text-white" : "text-neutral-700 hover:bg-neutral-100"].join(" ")}
                    >
                      <Icon className="h-4 w-4" />
                      {n.label}
                    </Link>
                  );
                })}
              </nav>
              <div className="flex items-center gap-2 shrink-0">
                <button type="button" onClick={() => router.push("/host/notifications")} className="inline-flex h-10 w-10 items-center justify-center rounded-full hover:bg-neutral-100 transition" aria-label="알림" title="알림">
                  <Bell className="h-5 w-5" />
                </button>
                <button type="button" onClick={() => router.push("/host/messages")} className="inline-flex h-10 w-10 items-center justify-center rounded-full hover:bg-neutral-100 transition" aria-label="메시지" title="메시지">
                  <Mail className="h-5 w-5" />
                </button>
                <div className="relative" ref={profileRef}>
                  <button type="button" onClick={() => setOpenProfile((v) => !v)} className="inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-white px-3 py-2 shadow-sm hover:shadow-md transition" aria-label="프로필">
                    <User className="h-5 w-5" />
                    <span className="hidden sm:inline text-sm font-semibold">프로필</span>
                    <ChevronDown className="h-4 w-4 text-neutral-500" />
                  </button>
                  {openProfile && (
                    <div className="absolute right-0 mt-2 w-56 overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-lg">
                      <Link href="/profile" className="block px-4 py-3 text-sm hover:bg-neutral-50">내 프로필(게스트)</Link>
                      <div className="h-px bg-neutral-200" />
                      <a href="/logout" className="block px-4 py-3 text-sm hover:bg-neutral-50">
                        <span className="inline-flex items-center gap-2"><LogOut className="h-4 w-4" />로그아웃</span>
                      </a>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="md:hidden pb-3">
              <div className="flex gap-2 overflow-x-auto no-scrollbar">
                {NAV.map((n) => {
                  const active = isActive(pathname, n.href);
                  return (
                    <Link key={n.href} href={n.href} className={["shrink-0 rounded-full border px-4 py-2 text-sm font-semibold transition", active ? "border-neutral-900 bg-neutral-900 text-white" : "border-neutral-200 bg-white hover:bg-neutral-50"].join(" ")}>
                      {n.label}
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
        <div className="border-b border-neutral-200">
          <div className="mx-auto w-full max-w-[1200px] px-4">
            <div className="flex items-center justify-between gap-3 py-5">
              <div className="text-2xl font-extrabold tracking-tight">{title}</div>
              <Link href="/" className="inline-flex items-center justify-center rounded-full border border-neutral-200 bg-white px-4 py-2 text-sm font-semibold hover:bg-neutral-50 transition">
                게스트 모드로 전환
              </Link>
            </div>
          </div>
        </div>
      </div>
      <main className="mx-auto w-full max-w-[1200px] px-4 py-8 pb-20">
        {children}
      </main>
    </div>
  );
}
