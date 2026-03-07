import { cookies } from "next/headers";
import { headers } from "next/headers";
import { detectLangFromAcceptLanguage, normalizeAppLang, langToLocale, type AppLang } from "@/lib/i18n/detect";

export async function getServerLang(): Promise<AppLang> {
  const c = await cookies();
  const cookieLang = c.get("kstay_lang")?.value || c.get("kst_lang")?.value || null;
  if (cookieLang) return normalizeAppLang(cookieLang);

  const h = await headers();
  return detectLangFromAcceptLanguage(h.get("accept-language"));
}

/** 선택 언어에 맞는 Intl locale (날짜/숫자 포맷용). 게스트 페이지 서버 컴포넌트에서 사용 */
export async function getServerLocale(): Promise<string> {
  const lang = await getServerLang();
  return langToLocale(lang);
}
