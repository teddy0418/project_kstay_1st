"use client";

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

export type Lang = "en" | "ko" | "ja" | "zh";

const LOCALE_MAP: Record<Lang, string> = { en: "en", ko: "ko", ja: "ja", zh: "zh-CN" };

type Ctx = {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: string, vars?: Record<string, string | number>) => string;
  languages: { code: Lang; label: string }[];
  /** For Intl/date formatting; use within LanguageProvider */
  locale: string;
  /** Alias for languages (back compat; includes nativeLabel for Header) */
  options: { code: Lang; label: string; nativeLabel: string }[];
};

const STORAGE_KEY = "kstay_lang";
const COOKIE_KEY = "kstay_lang";
const DEFAULT_LANG: Lang = "en";

const DICT: Record<Lang, Record<string, string>> = {
  en: {
    popular_destinations: "Popular destinations in Korea",
    swipe_to_explore: "Swipe or use arrows to explore",
    tap_to_explore: "Tap to explore",
    where_to: "Where to?",
    search_cities_placeholder: "Search cities (e.g., Seoul, Jeju)…",
    popular: "Popular",
    anywhere: "Anywhere",
    when: "When",
    guests: "Guests",
    search: "Search",
    dashboard: "DASHBOARD",

    host_onboarding_title: "You haven't listed any stays yet.",
    host_onboarding_desc:
      "List your first property and start receiving bookings from global travelers.",
    host_onboarding_cta: "List my first stay",
    host_onboarding_value_1: "0% host fee (KSTAY partners benefit)",
    host_onboarding_value_2: "Transparent pricing for guests",
    host_onboarding_value_3: "Weekly settlements (Tue)",
  },
  ko: {
    popular_destinations: "한국 인기 여행지",
    swipe_to_explore: "스와이프 또는 화살표로 이동",
    tap_to_explore: "눌러서 탐색",
    where_to: "어디로 갈까요?",
    search_cities_placeholder: "도시 검색 (예: 서울, 제주)…",
    popular: "인기",
    anywhere: "어디든지",
    when: "날짜",
    guests: "인원",
    search: "검색",
    dashboard: "대시보드",

    host_onboarding_title: "아직 등록된 숙소가 없습니다.",
    host_onboarding_desc:
      "숙소를 등록하면 전 세계 외국인 관광객에게 노출되고 예약을 받을 수 있어요.",
    host_onboarding_cta: "숙소 등록하기",
    host_onboarding_value_1: "호스트 수수료 0% (파트너 혜택)",
    host_onboarding_value_2: "게스트는 최종가 투명 노출",
    host_onboarding_value_3: "화요일 정산(주간)",
  },
  ja: {
    popular_destinations: "韓国の人気旅行先",
    swipe_to_explore: "スワイプまたは矢印で移動",
    tap_to_explore: "タップして探す",
    where_to: "どこへ？",
    search_cities_placeholder: "都市を検索（例：Seoul, Jeju）…",
    popular: "人気",
    anywhere: "どこでも",
    when: "日程",
    guests: "人数",
    search: "検索",
    dashboard: "ダッシュボード",

    host_onboarding_title: "まだ宿泊施設が登録されていません。",
    host_onboarding_desc:
      "最初の宿を登録して、世界中の旅行者から予約を受けましょう。",
    host_onboarding_cta: "宿を登録する",
    host_onboarding_value_1: "ホスト手数料 0%",
    host_onboarding_value_2: "料金は最終価格で透明表示",
    host_onboarding_value_3: "毎週火曜に精算",
  },
  zh: {
    popular_destinations: "韩国热门目的地",
    swipe_to_explore: "滑动或使用箭头浏览",
    tap_to_explore: "点击查看",
    where_to: "想去哪里？",
    search_cities_placeholder: "搜索城市（例如：Seoul, Jeju）…",
    popular: "热门",
    anywhere: "不限目的地",
    when: "日期",
    guests: "人数",
    search: "搜索",
    dashboard: "仪表盘",

    host_onboarding_title: "你还没有发布房源。",
    host_onboarding_desc:
      "发布第一个房源，让全球旅客看到并开始接收预订。",
    host_onboarding_cta: "发布我的第一个房源",
    host_onboarding_value_1: "房东手续费 0%",
    host_onboarding_value_2: "面向旅客的透明最终价",
    host_onboarding_value_3: "每周二结算",
  },
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

const LanguageContext = createContext<Ctx | null>(null);

export default function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>(DEFAULT_LANG);

  useEffect(() => {
    const fromLS = typeof window !== "undefined" ? window.localStorage.getItem(STORAGE_KEY) : null;
    const fromCookie = getCookie(COOKIE_KEY);
    const saved = (fromLS || fromCookie || "").trim();
    if (saved && isLang(saved)) setLangState(saved);
  }, []);

  const setLang = (l: Lang) => {
    setLangState(l);
    try {
      window.localStorage.setItem(STORAGE_KEY, l);
    } catch {}
    setCookie(COOKIE_KEY, l);
    if (typeof document !== "undefined") document.documentElement.lang = l === "zh" ? "zh" : l;
  };

  const t = (key: string, vars?: Record<string, string | number>) => {
    const base = DICT[lang] ?? DICT.en;
    let s = base[key] ?? DICT.en[key] ?? key;

    if (vars) {
      for (const [k, v] of Object.entries(vars)) {
        s = s.replaceAll(`{${k}}`, String(v));
      }
    }
    return s;
  };

  const languages = useMemo(
    () => [
      { code: "en" as Lang, label: "English", nativeLabel: "English" },
      { code: "ko" as Lang, label: "한국어", nativeLabel: "한국어" },
      { code: "ja" as Lang, label: "日本語", nativeLabel: "日本語" },
      { code: "zh" as Lang, label: "中文", nativeLabel: "中文" },
    ],
    []
  );

  const value = useMemo<Ctx>(
    () => ({
      lang,
      setLang,
      t,
      languages,
      locale: LOCALE_MAP[lang] ?? "en",
      options: languages,
    }),
    [lang, languages]
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useI18n must be used within <LanguageProvider/>");
  return ctx;
}
