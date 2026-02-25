/**
 * 숙소 유형 (호스트 위저드 + 추후 상세/검토 등 표시용)
 * value는 DB 저장값, label은 한국어 표시용.
 */
export const PROPERTY_TYPES = [
  { value: "house_villa", label: "주택/빌라" },
  { value: "hanok", label: "한옥" },
  { value: "apartment", label: "아파트" },
  { value: "residence", label: "레지던스" },
  { value: "hostel", label: "호스텔" },
] as const;

export type PropertyTypeValue = (typeof PROPERTY_TYPES)[number]["value"];

const VALUE_SET = new Set(PROPERTY_TYPES.map((p) => p.value));

/** 예전에 저장된 숙소 유형을 현재 5종으로 매핑 (추후 호환) */
export function normalizePropertyType(raw: string | null | undefined): string {
  if (!raw || typeof raw !== "string") return "";
  const trimmed = raw.trim();
  if (VALUE_SET.has(trimmed as PropertyTypeValue)) return trimmed;
  const legacy: Record<string, string> = {
    house: "house_villa",
    secondary: "house_villa",
    hotel_room: "hostel",
    other: "house_villa",
  };
  return legacy[trimmed] ?? "";
}

/** value → 한국어 라벨 (상세/검토 등에서 표시용) */
export function getPropertyTypeLabel(value: string | null | undefined): string {
  if (!value) return "";
  const normalized = normalizePropertyType(value);
  const found = PROPERTY_TYPES.find((p) => p.value === normalized);
  return found?.label ?? value;
}
