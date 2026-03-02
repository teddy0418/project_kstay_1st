/** Amenity key -> i18n labels. 4 categories, 24 items (6 per category). */
export type AmenityKey =
  | "wifi_fast"
  | "universal_adapter"
  | "smart_lock"
  | "ott"
  | "pocket_wifi"
  | "workspace"
  | "bath_towel"
  | "bidet"
  | "hair_dryer"
  | "washing_machine"
  | "clothes_dryer"
  | "iron"
  | "water_purifier"
  | "coffee_machine"
  | "microwave"
  | "electric_kettle"
  | "refrigerator"
  | "cooking_basics"
  | "luggage_storage"
  | "trash_guide_en"
  | "first_aid_kit"
  | "fire_extinguisher"
  | "smoke_alarm"
  | "carbon_monoxide_detector";

export type AmenityCategoryKey = "convenience_it" | "bath_laundry" | "kitchen" | "service_safety";

export type AmenityItem = {
  key: AmenityKey;
  en: string;
  ko: string;
  ja?: string;
  zh?: string;
};

export const AMENITY_CATEGORIES: {
  key: AmenityCategoryKey;
  labelKo: string;
  labelEn: string;
  items: AmenityItem[];
}[] = [
  {
    key: "convenience_it",
    labelKo: "편의 및 IT",
    labelEn: "Convenience & IT",
    items: [
      { key: "wifi_fast", en: "High-Speed Wi-Fi", ko: "초고속 와이파이", ja: "高速Wi-Fi", zh: "高速Wi-Fi" },
      { key: "universal_adapter", en: "Universal Adapter", ko: "멀티 어댑터/돼지코", ja: "ユニバーサルアダプター", zh: "万能转换插头" },
      { key: "smart_lock", en: "Smart Lock", ko: "셀프 체크인용 도어락", ja: "スマートロック", zh: "智能门锁" },
      { key: "ott", en: "Netflix / Disney+", ko: "OTT 서비스", ja: "Netflix / Disney+", zh: "OTT 流媒体" },
      { key: "pocket_wifi", en: "Pocket Wi-Fi", ko: "휴대용 와이파이 대여", ja: "ポケットWi-Fiレンタル", zh: "便携Wi-Fi租赁" },
      { key: "workspace", en: "Workspace / Desk", ko: "업무용 책상·의자", ja: "ワークスペース・デスク", zh: "办公桌椅" },
    ],
  },
  {
    key: "bath_laundry",
    labelKo: "욕실 및 세탁",
    labelEn: "Bath & Laundry",
    items: [
      { key: "bath_towel", en: "Full-size Bath Towel", ko: "대형 바디 타월", ja: "大型バスタオル", zh: "大号浴巾" },
      { key: "bidet", en: "Bidet", ko: "비데", ja: "ウォシュレット", zh: "智能马桶" },
      { key: "hair_dryer", en: "Hair Dryer", ko: "헤어드라이어", ja: "ヘアードライヤー", zh: "吹风机" },
      { key: "washing_machine", en: "Washing Machine", ko: "세탁기", ja: "洗濯機", zh: "洗衣机" },
      { key: "clothes_dryer", en: "Clothes Dryer", ko: "건조기 (장기 투숙객 필수)", ja: "乾燥機", zh: "烘干机" },
      { key: "iron", en: "Iron & Ironing Board", ko: "다리미·다리미판", ja: "アイロン・アイロン台", zh: "熨斗和熨衣板" },
    ],
  },
  {
    key: "kitchen",
    labelKo: "주방 및 식사",
    labelEn: "Kitchen & Dining",
    items: [
      { key: "water_purifier", en: "Water Purifier", ko: "정수기", ja: "浄水器", zh: "净水器" },
      { key: "coffee_machine", en: "Coffee Machine", ko: "커피 머신", ja: "コーヒーメーカー", zh: "咖啡机" },
      { key: "microwave", en: "Microwave", ko: "전자레인지", ja: "電子レンジ", zh: "微波炉" },
      { key: "electric_kettle", en: "Electric Kettle", ko: "전기포트", ja: "電気ケトル", zh: "电热水壶" },
      { key: "refrigerator", en: "Refrigerator", ko: "냉장고", ja: "冷蔵庫", zh: "冰箱" },
      { key: "cooking_basics", en: "Cooking Basics / Utensils", ko: "기본 조리도구·식기", ja: "基本調理器具・食器", zh: "基本厨具餐具" },
    ],
  },
  {
    key: "service_safety",
    labelKo: "서비스 및 안전",
    labelEn: "Service & Safety",
    items: [
      { key: "luggage_storage", en: "Luggage Storage", ko: "짐 보관 서비스", ja: "荷物預かり", zh: "行李寄存" },
      { key: "trash_guide_en", en: "English Trash Guide", ko: "영어 분리수거 안내문", ja: "英語ゴミ分別案内", zh: "英文垃圾分类指南" },
      { key: "first_aid_kit", en: "First Aid Kit", ko: "구급함", ja: "救急箱", zh: "急救箱" },
      { key: "fire_extinguisher", en: "Fire Extinguisher", ko: "소화기", ja: "消火器", zh: "灭火器" },
      { key: "smoke_alarm", en: "Smoke Alarm", ko: "연기 경보기", ja: "煙感知器", zh: "烟雾报警器" },
      { key: "carbon_monoxide_detector", en: "Carbon Monoxide Detector", ko: "일산화탄소 경보기", ja: "一酸化炭素検知器", zh: "一氧化碳报警器" },
    ],
  },
];

/** Flat list of all amenity keys (for validation / listing). */
export const AMENITY_KEYS: AmenityKey[] = AMENITY_CATEGORIES.flatMap((c) => c.items.map((i) => i.key));

/** Labels by key (ko, en, ja, zh). */
export type AmenityLabels = { ko: string; en: string; ja?: string; zh?: string };

const _labelMap = new Map<string, AmenityLabels>();
AMENITY_CATEGORIES.forEach((cat) => {
  cat.items.forEach((item) => {
    _labelMap.set(item.key, {
      ko: item.ko,
      en: item.en,
      ja: item.ja,
      zh: item.zh,
    });
  });
});

export function getAmenityLabel(key: string, lang: "en" | "ko" | "ja" | "zh"): string {
  const labels = _labelMap.get(key);
  if (!labels) return key;
  const v = labels[lang] ?? labels.en ?? labels.ko;
  return v ?? key;
}
