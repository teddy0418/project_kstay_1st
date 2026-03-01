"use client";

import { useMemo } from "react";
import LanguageProvider, { type Lang } from "@/components/ui/LanguageProvider";

const LANG_ATTR_TO_LANG: Record<string, Lang> = {
  en: "en",
  ko: "ko",
  ja: "ja",
  zh: "zh",
};

function getInitialLang(): Lang {
  if (typeof document === "undefined") return "en";
  const attr = document.documentElement.getAttribute("lang") || "";
  return LANG_ATTR_TO_LANG[attr] ?? "en";
}

/** (guest) 세그먼트가 RSC 경계에서 Provider 트리가 끊기지 않도록 감쌈 */
export default function GuestI18nWrapper({ children }: { children: React.ReactNode }) {
  const initialLang = useMemo(() => getInitialLang(), []);
  return <LanguageProvider initialLang={initialLang}>{children}</LanguageProvider>;
}
