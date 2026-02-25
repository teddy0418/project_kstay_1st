import type { WizardListing } from "./ListingWizardContext";

export const WIZARD_STEPS = [
  { slug: "location", label: "위치", shortLabel: "위치" },
  { slug: "pricing", label: "가격", shortLabel: "가격" },
  { slug: "amenities", label: "어메니티", shortLabel: "편의" },
  { slug: "photos", label: "사진", shortLabel: "사진" },
  { slug: "guide", label: "숙소정보", shortLabel: "정보" },
  { slug: "review", label: "검토", shortLabel: "검토" },
] as const;

export type WizardStepSlug = (typeof WIZARD_STEPS)[number]["slug"];

export function getStepIndex(slug: string): number {
  const i = WIZARD_STEPS.findIndex((s) => s.slug === slug);
  return i >= 0 ? i : 0;
}

/** 저장된 listing 기준으로 해당 단계가 “완료”인지 (게이미피케이션 체크/진행률용) */
export function isStepComplete(slug: WizardStepSlug, listing: WizardListing | null): boolean {
  if (!listing) return false;
  switch (slug) {
    case "guide": {
      const name = (listing.title?.trim() || listing.titleKo?.trim() || "") as string;
      const hasName = name.length > 0 && name !== "신규 숙소";
      const hasType = Boolean((listing as { propertyType?: string | null }).propertyType?.trim());
      const hasGuests = Number(listing.maxGuests) >= 1;
      const desc = (listing.hostBioKo?.trim() || listing.hostBio?.trim() || "") as string;
      return hasName && hasType && hasGuests && desc.length >= 20;
    }
    case "location": {
      const addr = listing.address?.trim() || "";
      const road = (listing as { roadAddress?: string | null }).roadAddress?.trim() || "";
      const isPlaceholder = addr === "주소를 입력해 주세요" || !addr;
      const hasAddress = (!isPlaceholder && addr.length > 0) || road.length > 0;
      const hasCoords = listing.lat != null && listing.lng != null;
      return hasAddress && hasCoords;
    }
    case "pricing":
      return Number(listing.basePriceKrw) > 0;
    case "amenities":
      return Array.isArray(listing.amenities) && listing.amenities.length >= 1;
    case "photos":
      return Array.isArray(listing.images) && listing.images.length >= 5;
    case "review":
      return true;
    default:
      return false;
  }
}

/** 완료된 단계 개수 (진행률 분자) */
export function completedStepsCount(listing: WizardListing | null): number {
  if (!listing) return 0;
  return WIZARD_STEPS.filter((s) => isStepComplete(s.slug, listing)).length;
}

/** 첫 번째 미완료 단계 slug. 모두 완료면 'review'. (편집 진입 시 이 단계로 이동용) */
export function getFirstIncompleteStep(listing: WizardListing | null): WizardStepSlug {
  if (!listing) return "location";
  for (const step of WIZARD_STEPS) {
    if (step.slug === "review") continue;
    if (!isStepComplete(step.slug, listing)) return step.slug;
  }
  return "review";
}
