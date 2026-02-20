import { cookies } from "next/headers";
import { headers } from "next/headers";
import { detectLangFromAcceptLanguage, normalizeAppLang, type AppLang } from "@/lib/i18n/detect";

export async function getServerLang(): Promise<AppLang> {
  const c = await cookies();
  const cookieLang = c.get("kstay_lang")?.value || c.get("kst_lang")?.value || null;
  if (cookieLang) return normalizeAppLang(cookieLang);

  const h = await headers();
  return detectLangFromAcceptLanguage(h.get("accept-language"));
}
