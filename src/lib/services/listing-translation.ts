/**
 * 숙소 설명(hostBio) 자동 번역 + DB 캐시
 * ja/zh 사용자일 때 hostBioJa/hostBioZh가 비어 있으면 번역 후 DB 저장
 */

import { prisma } from "@/lib/db";
import { translateText } from "@/lib/translation";

type ListingWithBio = {
  id: string;
  hostBio: string;
  hostBioI18n?: { en?: string; ko?: string; ja?: string; zh?: string };
};

/**
 * en/ja/zh일 때 해당 언어 번역이 없으면 hostBio(또는 hostBioKo)를 번역 후 DB에 캐시하고 listing 객체에 반영
 * 입력 객체를 mutate하며 동일 참조 반환
 */
export async function ensureHostBioTranslated<T extends ListingWithBio>(
  listing: T,
  lang: "en" | "ko" | "ja" | "zh"
): Promise<T> {
  if (lang !== "en" && lang !== "ja" && lang !== "zh") return listing;

  const source = (listing.hostBioI18n?.ko?.trim() || listing.hostBio?.trim()) || "";
  if (!source || source.length < 10) return listing;

  const cached =
    lang === "en"
      ? listing.hostBioI18n?.en?.trim()
      : lang === "ja"
        ? listing.hostBioI18n?.ja?.trim()
        : listing.hostBioI18n?.zh?.trim();
  if (cached) return listing;

  const targetLang = lang === "en" ? "en" : (lang as "ja" | "zh");
  const translated = await translateText(source, targetLang);
  if (translated === source) return listing;

  try {
    await prisma.listing.update({
      where: { id: listing.id },
      data:
        lang === "en"
          ? { hostBioEn: translated }
          : lang === "ja"
            ? { hostBioJa: translated }
            : { hostBioZh: translated },
    });
  } catch (e) {
    console.error("[listing-translation] DB update failed", listing.id, e);
  }

  listing.hostBioI18n = {
    ...listing.hostBioI18n,
    [lang]: translated,
  };
  return listing;
}
