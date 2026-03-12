"use client";

import { usePathname } from "next/navigation";
import FloatingSearch from "./FloatingSearch";
import HomeAdPanels from "./HomeAdPanels";

/**
 * 메인(/)과 board(/board, /board/*)에서만 상단 광고 3패널 + 검색바 표시
 */
export default function FloatingSearchWrapper() {
  const pathname = usePathname();
  const showSearch = pathname === "/" || pathname.startsWith("/board");

  if (!showSearch) return null;
  return (
    <div className="relative">
      <div className="relative z-10">
        <HomeAdPanels />
        <FloatingSearch />
      </div>
    </div>
  );
}
