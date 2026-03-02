/**
 * Google Cloud Translation API v2 (Basic) 연동
 * API 키 사용 시 Cloud Translation API 활성화 필요
 * 비용 절감: 호출 결과를 DB에 캐시해 재사용
 */

const API_URL = "https://translation.googleapis.com/language/translate/v2";

export type TargetLang = "ja" | "zh" | "ko" | "en";

/** 텍스트를 대상 언어로 번역. API 키 없거나 오류 시 원문 반환 */
export async function translateText(
  text: string,
  targetLang: TargetLang
): Promise<string> {
  const key = process.env.GOOGLE_TRANSLATE_API_KEY?.trim();
  if (!key || !text?.trim()) return text;

  try {
    const res = await fetch(`${API_URL}?key=${encodeURIComponent(key)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        q: text.trim(),
        target: targetLang === "zh" ? "zh-CN" : targetLang,
        format: "text",
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error("[translation] API error", res.status, err);
      return text;
    }

    const json = (await res.json()) as {
      data?: { translations?: Array<{ translatedText?: string }> };
    };
    const translated =
      json?.data?.translations?.[0]?.translatedText?.trim();
    return translated ?? text;
  } catch (e) {
    console.error("[translation] failed", e);
    return text;
  }
}
