"use client";

import LanguageProvider, { type Lang } from "@/components/ui/LanguageProvider";

/** (guest) 세그먼트가 RSC 경계에서 Provider 트리가 끊기지 않도록 감쌈. initialLang은 서버에서 쿠키/헤더로 결정해 전달하여 서버·클라이언트 첫 렌더를 맞춤(하이드레이션 오류 방지). */
export default function GuestI18nWrapper({
  children,
  initialLang,
}: {
  children: React.ReactNode;
  initialLang?: Lang;
}) {
  return <LanguageProvider initialLang={initialLang}>{children}</LanguageProvider>;
}
