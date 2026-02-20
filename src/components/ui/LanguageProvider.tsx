"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import enDict from "@/locales/en.json";

export type Lang = "en" | "ko" | "ja" | "zh";

type Option = { code: Lang; label: string; nativeLabel: string; locale: string };

type Ctx = {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: string, vars?: Record<string, string | number>) => string;
  options: Option[];
  languages: { code: Lang; label: string; nativeLabel: string }[];
  locale: string;
};

const COOKIE_KEYS = ["kstay_lang", "kst_lang"];
const STORAGE_KEYS = ["kstay_lang", "kst_lang"];
const DEFAULT_LANG: Lang = "en";

const OPTIONS: Option[] = [
  { code: "en", label: "English", nativeLabel: "English", locale: "en-US" },
  { code: "ko", label: "Korean", nativeLabel: "한국어", locale: "ko-KR" },
  { code: "ja", label: "Japanese", nativeLabel: "日本語", locale: "ja-JP" },
  { code: "zh", label: "Chinese", nativeLabel: "中文", locale: "zh-CN" },
];

type Dict = Record<string, string>;
const DEFAULT_DICT: Dict = enDict as Dict;
const LOADERS: Record<Lang, () => Promise<{ default: Dict }>> = {
  en: () => import("@/locales/en.json"),
  ko: () => import("@/locales/ko.json"),
  ja: () => import("@/locales/ja.json"),
  zh: () => import("@/locales/zh.json"),
};

function isLang(x: string): x is Lang {
  return x === "en" || x === "ko" || x === "ja" || x === "zh";
}

function getCookie(name: string) {
  if (typeof document === "undefined") return "";
  const m = document.cookie.match(new RegExp("(^| )" + name + "=([^;]+)"));
  return m ? decodeURIComponent(m[2]) : "";
}

function setCookie(name: string, value: string, days = 365) {
  if (typeof document === "undefined") return;
  const maxAge = days * 24 * 60 * 60;
  document.cookie = `${name}=${encodeURIComponent(value)}; Max-Age=${maxAge}; Path=/; SameSite=Lax`;
}

function persistLang(l: Lang) {
  try {
    for (const k of STORAGE_KEYS) window.localStorage.setItem(k, l);
  } catch {}
  for (const k of COOKIE_KEYS) setCookie(k, l);
  if (typeof document !== "undefined") {
    document.documentElement.lang = l === "zh" ? "zh" : l;
  }
}

function localeOf(l: Lang) {
  return OPTIONS.find((o) => o.code === l)?.locale ?? "en-US";
}

const LanguageContext = createContext<Ctx | null>(null);

export default function LanguageProvider({
  children,
  initialLang,
}: {
  children: React.ReactNode;
  initialLang?: Lang;
}) {
  const router = useRouter();
  const [lang, setLangState] = useState<Lang>(initialLang ?? DEFAULT_LANG);
  const [dict, setDict] = useState<Dict>(DEFAULT_DICT);

  useEffect(() => {
    let saved = "";
    try {
      for (const k of STORAGE_KEYS) {
        const v = window.localStorage.getItem(k) || "";
        if (v) {
          saved = v;
          break;
        }
      }
    } catch {}

    if (!saved) {
      for (const k of COOKIE_KEYS) {
        const v = getCookie(k);
        if (v) {
          saved = v;
          break;
        }
      }
    }

    if (saved && isLang(saved) && saved !== lang) {
      setLangState(saved);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    persistLang(lang);
  }, [lang]);

  useEffect(() => {
    let active = true;
    void LOADERS[lang]()
      .then((mod) => {
        if (active) setDict((mod.default as Dict) ?? DEFAULT_DICT);
      })
      .catch(() => {
        if (active) setDict(DEFAULT_DICT);
      });

    return () => {
      active = false;
    };
  }, [lang]);

  const setLang = useCallback(
    (l: Lang) => {
      setLangState(l);
      persistLang(l);
      router.refresh();
    },
    [router]
  );

  const t = useCallback(
    (key: string, vars?: Record<string, string | number>) => {
      let s = dict[key] ?? DEFAULT_DICT[key] ?? key;
      if (vars) {
        for (const [k, v] of Object.entries(vars)) {
          s = s.replaceAll(`{${k}}`, String(v));
        }
      }
      return s;
    },
    [dict]
  );

  const value = useMemo<Ctx>(
    () => ({
      lang,
      setLang,
      t,
      options: OPTIONS,
      languages: OPTIONS.map((o) => ({ code: o.code, label: o.label, nativeLabel: o.nativeLabel })),
      locale: localeOf(lang),
    }),
    [lang, setLang, t]
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useI18n must be used within <LanguageProvider/>");
  return ctx;
}
