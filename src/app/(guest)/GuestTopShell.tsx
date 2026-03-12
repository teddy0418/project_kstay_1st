"use client";

import { usePathname } from "next/navigation";
import Header from "@/components/layout/Header";
import FloatingSearchWrapper from "@/components/layout/FloatingSearchWrapper";

export default function GuestTopShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const showTop = pathname === "/" || pathname.startsWith("/board");

  if (!showTop) {
    return (
      <>
        <Header />
        {children}
      </>
    );
  }

  return (
    <>
      <div className="relative">
        {/* 상단(검색바~헤더) 구간 배경 그라데이션: 스크롤 시 함께 사라짐 */}
        <div
          className="absolute inset-x-0 top-0 z-0 h-[300px] bg-gradient-to-b from-transparent via-neutral-950/55 to-neutral-950/95 pointer-events-none"
          aria-hidden
        />
        {/* 그라데이션 끝 구분: 1px 소프트 라인 + 약한 섀도우 밴드 */}
        <div
          className="absolute top-[300px] z-0 left-6 right-6 h-0.5 rounded-full bg-white/15 pointer-events-none sm:left-0 sm:right-0 sm:h-px sm:rounded-none"
          aria-hidden
        />
        <div
          className="absolute inset-x-0 top-[300px] z-0 h-6 bg-gradient-to-b from-neutral-950/25 to-transparent pointer-events-none"
          aria-hidden
        />

        <div className="relative z-10">
          <Header />
          <div className="relative z-40">
            <FloatingSearchWrapper />
          </div>
        </div>
      </div>

      {/* 아래 흰색 컨텐츠 영역: PC는 일직선, 모바일(sm 미만)만 둥글게 */}
      <div className="relative z-0 -mt-32 rounded-t-[28px] bg-white pt-32 shadow-[0_-18px_28px_-22px_rgba(0,0,0,0.65)] ring-1 ring-black/5 sm:mt-0 sm:rounded-none sm:pt-6 md:pt-8 sm:shadow-none sm:ring-0">
        {children}
      </div>
    </>
  );
}

