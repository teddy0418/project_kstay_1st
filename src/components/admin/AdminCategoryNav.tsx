"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const ITEMS = [
  { label: "요약", href: "/admin" },
  { label: "숙소 관리", href: "/admin/listings" },
  { label: "게시판 관리", href: "/admin/board" },
  { label: "예약 관리", href: "/admin/bookings" },
  { label: "정산", href: "/admin/settlements" },
  { label: "테스트 리뷰", href: "/admin/test-review" },
] as const;

export default function AdminCategoryNav() {
  const pathname = usePathname();

  return (
    <nav
      className="sticky top-14 z-30 flex flex-wrap items-center gap-2 border-b border-neutral-200 bg-white px-4 py-3 shadow-sm sm:gap-3"
      aria-label="관리자 메뉴"
    >
      <div className="mx-auto flex w-full max-w-screen-xl flex-wrap items-center gap-2 sm:gap-3">
        {ITEMS.map((item) => {
          const isActive =
            item.href === "/admin"
              ? pathname === "/admin" || pathname === "/admin/"
              : pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`rounded-xl px-4 py-3 text-base font-semibold transition sm:px-5 sm:py-3.5 sm:text-lg ${
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
