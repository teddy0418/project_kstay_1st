"use client";

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { DEFAULT_LANG, type Lang, LANG_OPTIONS, type I18nKey, translate, localeOf } from "@/lib/i18n";

type Ctx = {
  lang: Lang;
  setLang: (l: Lang) => void;
  locale: string;
  t: (key: I18nKey) => string;
  options: typeof LANG_OPTIONS;
};

const LanguageContext = createContext<Ctx | null>(null);

const STORAGE_KEY = "kst_lang";
const COOKIE_KEY = "kst_lang";

function isLang(v: string): v is Lang {
  return v === "en" || v === "ko" || v === "ja" || v === "zh";
}

function readCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const hit = document.cookie
    .split("; ")
    .find((row) => row.startsWith(name + "="))
    ?.split("=")[1];
  return hit ? decodeURIComponent(hit) : null;
}

function writeCookieLang(lang: Lang) {
  if (typeof document === "undefined") return;
  const oneYear = 60 * 60 * 24 * 365;
  document.cookie = `${COOKIE_KEY}=${encodeURIComponent(lang)}; path=/; max-age=${oneYear}; samesite=lax`;
}

function getInitialLang(): Lang {
  if (typeof window === "undefined") return DEFAULT_LANG;
  const savedLS = window.localStorage.getItem(STORAGE_KEY);
  if (savedLS && isLang(savedLS)) return savedLS;
  const savedCookie = readCookie(COOKIE_KEY);
  if (savedCookie && isLang(savedCookie)) return savedCookie;
  return DEFAULT_LANG;
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>(getInitialLang);

  // 변경 시: html lang + localStorage + cookie 모두 업데이트
  useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.lang = lang;
      writeCookieLang(lang);
    }
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, lang);
    }
  }, [lang]);

  const api = useMemo<Ctx>(() => {
    return {
      lang,
      setLang: setLangState,
      locale: localeOf(lang),
      t: (key) => translate(lang, key),
      options: LANG_OPTIONS,
    };
  }, [lang]);

  return <LanguageContext.Provider value={api}>{children}</LanguageContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    return {
      lang: DEFAULT_LANG as Lang,
      setLang: () => {},
      locale: localeOf(DEFAULT_LANG),
      t: (key: I18nKey) => translate(DEFAULT_LANG, key),
      options: LANG_OPTIONS,
    };
  }
  return ctx;
}
