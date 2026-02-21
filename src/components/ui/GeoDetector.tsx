"use client";

import { useEffect, useRef } from "react";
import { useCurrency } from "@/components/ui/CurrencyProvider";
import { useI18n } from "@/components/ui/LanguageProvider";
import type { Lang } from "@/components/ui/LanguageProvider";

function getCookie(name: string): string {
  if (typeof document === "undefined") return "";
  const m = document.cookie.match(new RegExp("(^| )" + name + "=([^;]+)"));
  return m ? decodeURIComponent(m[2]) : "";
}

/**
 * 최초 방문자: 쿠키/로컬스토리지가 없을 때만 /api/geo 호출하여 IP 기반으로 언어·통화 적용
 * 수동 선택이 있으면 이 컴포넌트는 아무것도 하지 않음
 */
export default function GeoDetector() {
  const { setLang, lang } = useI18n();
  const { setCurrency, currency } = useCurrency();
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    const hasLang = getCookie("kstay_lang") || getCookie("kst_lang");
    const hasCurrency = getCookie("kst_currency");
    if (hasLang && hasCurrency) return;

    ran.current = true;
    fetch("/api/geo")
      .then((r) => r.json())
      .then((data: { lang?: Lang; currency?: string }) => {
        if (!hasLang && data.lang && data.lang !== lang) setLang(data.lang);
        if (!hasCurrency && data.currency && data.currency !== currency) setCurrency(data.currency as "USD" | "KRW" | "JPY" | "CNY");
      })
      .catch(() => {});
  }, [lang, currency, setLang, setCurrency]);

  return null;
}
