"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Heart, MapPin, MessageCircle, UserCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { href: "/", label: "Home", icon: Home },
  { href: "/wishlist", label: "Wishlist", icon: Heart },
  { href: "/board", label: "Board", icon: MapPin },
  { href: "/messages", label: "Message", icon: MessageCircle },
  { href: "/profile", label: "Profile", icon: UserCircle2 },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-[70] border-t border-neutral-200 bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/70">
      <div className="mx-auto w-full max-w-screen-sm grid grid-cols-5 px-4 py-2">
        {items.map((it) => {
          const active =
            pathname === it.href || (it.href !== "/" && pathname.startsWith(it.href));
          const Icon = it.icon;
          return (
            <Link
              key={it.href}
              href={it.href}
              className={cn(
                "flex flex-col items-center justify-center gap-1 rounded-xl py-2 text-[11px]",
                active ? "text-brand" : "text-neutral-600"
              )}
            >
              <Icon className="h-5 w-5" />
              {it.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
