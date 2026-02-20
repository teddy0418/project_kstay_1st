export type AppLang = "en" | "ko" | "ja" | "zh";

export function normalizeAppLang(raw?: string | null): AppLang {
  if (!raw) return "en";
  const v = raw.trim().toLowerCase();
  if (v.startsWith("ko")) return "ko";
  if (v.startsWith("ja")) return "ja";
  if (v.startsWith("zh")) return "zh";
  return "en";
}

export function detectLangFromAcceptLanguage(header: string | null | undefined): AppLang {
  if (!header) return "en";
  const tokens = header
    .split(",")
    .map((x) => x.split(";")[0]?.trim().toLowerCase())
    .filter(Boolean) as string[];

  for (const token of tokens) {
    if (token.startsWith("ko")) return "ko";
    if (token.startsWith("ja")) return "ja";
    if (token.startsWith("zh")) return "zh";
    if (token.startsWith("en")) return "en";
  }
  return "en";
}
