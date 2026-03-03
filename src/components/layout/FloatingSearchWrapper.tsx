"use client";

import { usePathname } from "next/navigation";
import FloatingSearch from "./FloatingSearch";
import TrustBanner from "./TrustBanner";

/**
 * 메인페이지(/)와 board(/board, /board/*)에서만 검색바 + 슬림 배너 표시
 */
export default function FloatingSearchWrapper() {
  const pathname = usePathname();
  const showSearch = pathname === "/" || pathname === "/board";

  if (!showSearch) return null;
  return (
    <>
      <TrustBanner />
      <FloatingSearch />
    </>
  );
}
