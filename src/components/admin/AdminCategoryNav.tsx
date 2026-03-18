"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/** 운영: 대시보드·숙소·예약·정산 */
const OPERATIONS = [
  { label: "요약", href: "/admin" },
  { label: "숙소 관리", href: "/admin/listings" },
  { label: "예약 관리", href: "/admin/bookings" },
  { label: "정산", href: "/admin/settlements" },
] as const;

/** 콘텐츠·정책: 광고(상위 노출), KSTAY Black, 게시판, 호스트 공지 */
const CONTENT = [
  { label: "광고 관리", href: "/admin/promotions" },
  { label: "KSTAY Black", href: "/admin/kstay-black" },
  { label: "게시판", href: "/admin/board" },
  { label: "호스트 공지", href: "/admin/host-announcements" },
] as const;

/** 고객 대응 */
const CUSTOMER = [{ label: "고객센터", href: "/admin/support" }] as const;

/** 테스트·도구 */
const TOOLS = [{ label: "테스트 리뷰", href: "/admin/test-review" }] as const;

const GROUPS: { sectionLabel: string; items: readonly { label: string; href: string }[] }[] = [
  { sectionLabel: "운영", items: OPERATIONS },
  { sectionLabel: "콘텐츠", items: CONTENT },
  { sectionLabel: "고객", items: CUSTOMER },
  { sectionLabel: "도구", items: TOOLS },
];

function isActive(href: string, pathname: string): boolean {
  if (href === "/admin") return pathname === "/admin" || pathname === "/admin/";
  return pathname === href || pathname.startsWith(href + "/");
}

export default function AdminCategoryNav() {
  const pathname = usePathname();

  return (
    <nav
      className="sticky top-14 z-30 border-b border-neutral-200 bg-white shadow-sm"
      aria-label="관리자 메뉴"
    >
      <div className="mx-auto w-full max-w-screen-xl px-4 py-3 overflow-x-auto overscroll-x-contain scrollbar-none">
        <div className="flex items-center gap-x-1 sm:gap-x-2 min-w-max sm:min-w-0 sm:flex-wrap sm:gap-y-2">
          {GROUPS.map((group, groupIndex) => (
            <div key={group.sectionLabel} className="flex items-center gap-1 sm:gap-2 shrink-0 sm:shrink">
              {groupIndex > 0 && (
                <span
                  className="hidden h-5 w-px bg-neutral-200 sm:inline-block"
                  aria-hidden
                />
              )}
              {group.items.map((item) => {
                const active = isActive(item.href, pathname);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`whitespace-nowrap rounded-xl px-3 py-2.5 text-sm font-semibold transition sm:px-4 sm:py-3 sm:text-base ${
                      active
                        ? "bg-neutral-900 text-white hover:bg-neutral-800"
                        : "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900"
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </nav>
  );
}
