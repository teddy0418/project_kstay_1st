/** Amenity key -> i18n labels. Used by host wizard and guest listing detail. */
export type AmenityKey =
  | "wifi"
  | "fitness"
  | "bath"
  | "cafe_bar"
  | "clean_kit"
  | "essentials"
  | "kitchen"
  | "ac"
  | "parking"
  | "washer"
  | "tv"
  | "elevator";

export const AMENITY_KEYS: AmenityKey[] = [
  "wifi",
  "essentials",
  "bath",
  "kitchen",
  "ac",
  "tv",
  "washer",
  "fitness",
  "cafe_bar",
  "clean_kit",
  "parking",
  "elevator",
];

export type AmenityLabels = { ko: string; en: string; ja: string; zh: string };

export const AMENITY_LABELS: Record<AmenityKey, AmenityLabels> = {
  wifi: { ko: "Wi‑Fi", en: "Wi‑Fi", ja: "Wi‑Fi", zh: "Wi‑Fi" },
  fitness: { ko: "피트니스", en: "Fitness", ja: "フィットネス", zh: "健身房" },
  bath: { ko: "욕실", en: "Bath", ja: "バス", zh: "浴室" },
  cafe_bar: { ko: "카페/바", en: "Cafe/Bar", ja: "カフェ/バー", zh: "咖啡/酒吧" },
  clean_kit: { ko: "클린 키트", en: "Clean kit", ja: "クリーンキット", zh: "清洁套装" },
  essentials: { ko: "필수품", en: "Essentials", ja: "必需品", zh: "基础用品" },
  kitchen: { ko: "주방", en: "Kitchen", ja: "キッチン", zh: "厨房" },
  ac: { ko: "에어컨", en: "Air conditioning", ja: "エアコン", zh: "空调" },
  parking: { ko: "주차", en: "Parking", ja: "駐車場", zh: "停车" },
  washer: { ko: "세탁기", en: "Washer", ja: "洗濯機", zh: "洗衣机" },
  tv: { ko: "TV", en: "TV", ja: "TV", zh: "电视" },
  elevator: { ko: "엘리베이터", en: "Elevator", ja: "エレベーター", zh: "电梯" },
};

export function getAmenityLabel(key: string, lang: "en" | "ko" | "ja" | "zh"): string {
  const labels = AMENITY_LABELS[key as AmenityKey];
  if (!labels) return key;
  return labels[lang] ?? labels.en;
}
