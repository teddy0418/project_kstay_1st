"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Heart, MapPin, MessageCircle, UserCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useI18n } from "@/components/ui/LanguageProvider";

const items = [
  { href: "/", labelKey: "home", icon: Home },
  { href: "/wishlist", labelKey: "wishlist", icon: Heart },
  { href: "/board", labelKey: "board", icon: MapPin },
  { href: "/messages", labelKey: "messages", icon: MessageCircle },
  { href: "/profile", labelKey: "profile", icon: UserCircle2 },
] as const;

export default function BottomNav() {
  const pathname = usePathname();
  const { t } = useI18n();
  const activeIndex = Math.max(
    0,
    items.findIndex(
      (it) => pathname === it.href || (it.href !== "/" && pathname.startsWith(it.href))
    )
  );

  return (
    <nav className="md:hidden fixed inset-x-0 bottom-3 z-[70] flex justify-center pb-[env(safe-area-inset-bottom)] pointer-events-none">
      <div className="pointer-events-auto mx-auto w-full max-w-xs sm:max-w-sm rounded-full border border-neutral-200/70 bg-white/40 px-4 py-1.5 shadow-soft backdrop-blur supports-[backdrop-filter]:bg-white/20">
        <div className="relative grid grid-cols-5">
          <div
            className="absolute inset-y-0 left-0 w-1/5 rounded-full bg-white/90 shadow-soft border border-neutral-900/5 transition-transform duration-200 ease-out"
            style={{ transform: `translateX(${activeIndex * 100}%)` }}
          />
          {items.map((it) => {
            const active =
              pathname === it.href || (it.href !== "/" && pathname.startsWith(it.href));
            const Icon = it.icon;
            return (
              <Link
                key={it.href}
                href={it.href}
                className={cn(
                  "relative z-10 flex flex-col items-center justify-center gap-0.5 rounded-full px-2 py-1.5 text-[11px] transition-colors",
                  active ? "text-neutral-900" : "text-neutral-600/90"
                )}
              >
                <Icon className="h-5 w-5" />
                {t(it.labelKey)}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
