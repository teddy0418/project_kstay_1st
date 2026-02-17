"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

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

const DICT: Record<Lang, Record<string, string>> = {
  en: {
    stays: "Stays",
    board: "Board",
    menu: "Menu",
    login_signup: "Log in / Sign up",
    logout: "Log out",
    wishlist: "Wishlist",
    messages: "Messages",
    profile: "Profile",
    host_partners: "Host Partners",
    admin: "Admin",
    language: "Language",
    currency: "Currency",
    signed_in: "Signed in",
    help_center: "Help Center",

    where_to: "Where to?",
    when_traveling: "Any week",
    guests: "Guests",
    search: "Search",
    anywhere: "Anywhere",

    popular_destinations: "Popular destinations in Korea",
    swipe_to_explore: "Swipe or use arrows to explore",
    tap_to_explore: "Tap to explore",
    popular: "POPULAR",
    search_cities_placeholder: "Search cities (e.g., Seoul, Jeju)",

    selected: "Selected",
    clear: "Clear",
    done: "Done",

    board_headline: "Food & Tips in Korea",
    board_subtitle: "Discover restaurants, local tips, and travel hacks.",
    back: "Back",
    read_more: "Read more",

    profile_settings: "Profile settings",
    save_changes: "Save changes",
    photo_url: "Photo URL",
    display_name: "Display name",
    about_you: "About you",
    your_trips: "Your trips",
    your_reviews: "Your reviews",
    recently_viewed: "Recently viewed",
    empty_recently_viewed: "No recently viewed stays yet.",
    empty_trips: "No bookings yet. Your trips will appear here.",
    sign_in_to_manage: "Log in to manage your profile.",

    login_required_wishlist: "Log in to save stays to your wishlist.",
    link_copied: "Link copied",
    add_wishlist: "Add to wishlist",
    remove_wishlist: "Remove from wishlist",
    share: "Share",
    tax_service_included: "Tax & service fee included",
    wishlist_desc: "Stays you saved for later.",
    wishlist_empty: "No saved stays yet. Tap the heart on a listing to save it.",
    tap_to_open: "Tap to open",

    login_modal_title: "Log in or sign up",
    login_modal_welcome: "Welcome to KSTAY",
    login_modal_desc: "Sign in to save your wishlist and manage bookings.",
    login_modal_terms: "By continuing, you agree to KSTAY Terms and Privacy Policy.",
  },
  ko: {
    stays: "숙소",
    board: "게시판",
    menu: "메뉴",
    login_signup: "로그인 / 회원가입",
    logout: "로그아웃",
    wishlist: "위시리스트",
    messages: "메시지",
    profile: "프로필",
    host_partners: "호스트 파트너",
    admin: "관리자",
    language: "언어",
    currency: "통화",
    signed_in: "로그인됨",
    help_center: "도움말 센터",

    where_to: "어디로 갈까요?",
    when_traveling: "언제 떠나시나요?",
    guests: "인원",
    search: "검색",
    anywhere: "어디든지",

    popular_destinations: "한국 인기 여행지",
    swipe_to_explore: "스와이프 또는 화살표로 이동",
    tap_to_explore: "눌러서 탐색",
    popular: "인기",
    search_cities_placeholder: "도시 검색 (예: Seoul, Jeju)",

    selected: "선택됨",
    clear: "초기화",
    done: "완료",

    board_headline: "한국 맛집 · 꿀팁",
    board_subtitle: "맛집, 현지 팁, 여행 꿀팁을 확인하세요.",
    back: "뒤로",
    read_more: "더 보기",

    profile_settings: "프로필 설정",
    save_changes: "저장하기",
    photo_url: "프로필 사진 URL",
    display_name: "이름",
    about_you: "자기소개",
    your_trips: "예약 내역",
    your_reviews: "내가 쓴 리뷰",
    recently_viewed: "최근 본 숙소",
    empty_recently_viewed: "최근 본 숙소가 아직 없습니다.",
    empty_trips: "예약 내역이 없습니다. 예약하면 여기에 표시됩니다.",
    sign_in_to_manage: "프로필을 관리하려면 로그인하세요.",

    login_required_wishlist: "위시리스트에 저장하려면 로그인하세요.",
    link_copied: "링크 복사됨",
    add_wishlist: "위시리스트에 추가",
    remove_wishlist: "위시리스트에서 제거",
    share: "공유",
    tax_service_included: "세금·서비스료 포함",
    wishlist_desc: "나중에 보고 싶은 숙소를 저장해 두세요.",
    wishlist_empty: "저장한 숙소가 없습니다. 숙소 카드의 하트를 눌러 저장하세요.",
    tap_to_open: "탭하여 열기",

    login_modal_title: "로그인 또는 회원가입",
    login_modal_welcome: "KSTAY에 오신 것을 환영합니다",
    login_modal_desc: "위시리스트 저장 및 예약 관리를 위해 로그인하세요.",
    login_modal_terms: "계속하시면 KSTAY 이용약관 및 개인정보처리방침에 동의하는 것으로 간주됩니다.",
  },
  ja: {
    stays: "宿泊",
    board: "掲示板",
    menu: "メニュー",
    login_signup: "ログイン / 登録",
    logout: "ログアウト",
    wishlist: "お気に入り",
    messages: "メッセージ",
    profile: "プロフィール",
    host_partners: "ホスト",
    admin: "管理",
    language: "言語",
    currency: "通貨",
    signed_in: "ログイン済み",
    help_center: "ヘルプセンター",

    where_to: "どこへ？",
    when_traveling: "いつ行きますか？",
    guests: "人数",
    search: "検索",
    anywhere: "どこでも",

    popular_destinations: "韓国の人気旅行先",
    swipe_to_explore: "スワイプまたは矢印で移動",
    tap_to_explore: "タップして探す",
    popular: "人気",
    search_cities_placeholder: "都市を検索 (例: Seoul, Jeju)",

    selected: "選択",
    clear: "クリア",
    done: "完了",

    board_headline: "韓国グルメ・コツ",
    board_subtitle: "グルメ、現地情報、旅行ハックをチェック。",
    back: "戻る",
    read_more: "もっと見る",

    profile_settings: "プロフィール設定",
    save_changes: "保存",
    photo_url: "写真URL",
    display_name: "名前",
    about_you: "自己紹介",
    your_trips: "予約",
    your_reviews: "レビュー",
    recently_viewed: "最近見た宿",
    empty_recently_viewed: "最近見た宿はまだありません。",
    empty_trips: "予約はまだありません。予約するとここに表示されます。",
    sign_in_to_manage: "プロフィール管理のためログインしてください。",

    login_required_wishlist: "お気に入りに保存するにはログインしてください。",
    link_copied: "リンクをコピーしました",
    add_wishlist: "お気に入りに追加",
    remove_wishlist: "お気に入りから削除",
    share: "共有",
    tax_service_included: "税・サービス料込み",
    wishlist_desc: "後で見たい宿を保存できます。",
    wishlist_empty: "保存した宿はまだありません。宿のハートをタップして保存してください。",
    tap_to_open: "タップして開く",

    login_modal_title: "ログインまたは登録",
    login_modal_welcome: "KSTAYへようこそ",
    login_modal_desc: "お気に入り保存と予約管理のためログインしてください。",
    login_modal_terms: "続行すると、KSTAY利用規約およびプライバシーポリシーに同意したものとみなされます。",
  },
  zh: {
    stays: "住宿",
    board: "社区",
    menu: "菜单",
    login_signup: "登录 / 注册",
    logout: "退出登录",
    wishlist: "心愿单",
    messages: "消息",
    profile: "个人资料",
    host_partners: "房东",
    admin: "管理",
    language: "语言",
    currency: "货币",
    signed_in: "已登录",
    help_center: "帮助中心",

    where_to: "去哪儿？",
    when_traveling: "何时出行？",
    guests: "人数",
    search: "搜索",
    anywhere: "任意地点",

    popular_destinations: "韩国热门目的地",
    swipe_to_explore: "滑动或使用箭头浏览",
    tap_to_explore: "点击查看",
    popular: "热门",
    search_cities_placeholder: "搜索城市 (例如: Seoul, Jeju)",

    selected: "已选择",
    clear: "清除",
    done: "完成",

    board_headline: "韩国美食与攻略",
    board_subtitle: "发现餐厅、当地小贴士与旅行技巧。",
    back: "返回",
    read_more: "查看更多",

    profile_settings: "个人资料设置",
    save_changes: "保存",
    photo_url: "头像URL",
    display_name: "姓名",
    about_you: "自我介绍",
    your_trips: "订单",
    your_reviews: "我的评价",
    recently_viewed: "最近浏览",
    empty_recently_viewed: "暂无最近浏览的住宿。",
    empty_trips: "暂无订单。预订后会显示在这里。",
    sign_in_to_manage: "请登录以管理个人资料。",

    login_required_wishlist: "请登录后将住宿加入心愿单。",
    link_copied: "链接已复制",
    add_wishlist: "加入心愿单",
    remove_wishlist: "从心愿单移除",
    share: "分享",
    tax_service_included: "含税及服务费",
    wishlist_desc: "保存您稍后想看的住宿。",
    wishlist_empty: "暂无保存的住宿。点击住宿卡片上的心形图标即可保存。",
    tap_to_open: "点击打开",

    login_modal_title: "登录或注册",
    login_modal_welcome: "欢迎使用 KSTAY",
    login_modal_desc: "登录以保存心愿单并管理预订。",
    login_modal_terms: "继续即表示您同意 KSTAY 服务条款和隐私政策。",
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
      const table = DICT[lang] ?? DICT.en;
      let s = table[key] ?? DICT.en[key] ?? key;
      if (vars) {
        for (const [k, v] of Object.entries(vars)) {
          s = s.replaceAll(`{${k}}`, String(v));
        }
      }
      return s;
    },
    [lang]
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
