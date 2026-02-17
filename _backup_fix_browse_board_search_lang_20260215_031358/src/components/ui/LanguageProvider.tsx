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

function isLang(v: string): v is Lang {
  return v === "en" || v === "ko" || v === "ja" || v === "zh";
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>(DEFAULT_LANG);

  useEffect(() => {
    const saved = typeof window !== "undefined" ? window.localStorage.getItem(STORAGE_KEY) : null;
    if (saved && isLang(saved)) {
      queueMicrotask(() => setLangState(saved));
    }
  }, []);

  useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.lang = lang;
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
