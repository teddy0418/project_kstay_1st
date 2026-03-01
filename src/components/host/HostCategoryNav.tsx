"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const ITEMS = [
  { label: "홈", href: "/host/dashboard" },
  { label: "캘린더", href: "/host/calendar" },
  { label: "숙소관리", href: "/host/listings" },
  { label: "메세지", href: "/host/messages" },
  { label: "정산 및 통계", href: "/host/settlements" },
] as const;

export default function HostCategoryNav() {
  const pathname = usePathname();

  return (
    <nav
      className="sticky top-14 z-30 flex items-center border-b border-neutral-200 bg-white px-2 py-3 shadow-sm sm:px-4 overflow-x-auto"
      aria-label="호스트 메뉴"
    >
      <div className="mx-auto flex w-full max-w-screen-xl min-w-0 flex-shrink-0 items-center justify-center sm:justify-start gap-2 sm:gap-3">
        {ITEMS.map((item) => {
          const isActive =
            item.href === "/host/dashboard"
              ? pathname === "/host/dashboard" || pathname === "/host"
              : pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`rounded-xl px-3 py-2.5 text-sm font-semibold transition sm:px-5 sm:py-3.5 sm:text-lg whitespace-nowrap ${
                isActive
                  ? "bg-neutral-900 text-white hover:bg-neutral-800"
                  : "text-neutral-700 hover:bg-neutral-100 hover:text-neutral-900"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
