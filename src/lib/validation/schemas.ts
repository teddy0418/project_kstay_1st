import { z } from "zod";
import { AMENITY_KEYS } from "@/lib/amenities";

const optionalTrimmedString = z
  .union([z.string(), z.null(), z.undefined()])
  .transform((value) => (typeof value === "string" ? value.trim() : undefined));

export const createBookingSchema = z.object({
  listingId: z.string().trim().min(1, "listingId is required"),
  checkIn: z.string().trim().min(1, "checkIn is required"),
  checkOut: z.string().trim().min(1, "checkOut is required"),
  guestEmail: optionalTrimmedString,
  guestName: optionalTrimmedString,
  guestsAdults: z.coerce.number().int().min(1).optional(),
  guestsChildren: z.coerce.number().int().min(0).optional(),
  guestsInfants: z.coerce.number().int().min(0).optional(),
  guestsPets: z.coerce.number().int().min(0).optional(),
  currency: z.enum(["USD", "KRW", "JPY", "CNY"]).optional(),
  paymentMethod: z.enum(["KAKAOPAY", "PAYPAL", "EXIMBAY"]).optional(),
  /** 환불 불가 특가 선택 (listing이 해당 옵션 제공 시에만 유효) */
  isNonRefundableSpecial: z.boolean().optional(),
  /** 정책 동의 시각 ISO 문자열 (분쟁 대비 스냅샷) */
  policyAgreedAt: z.string().trim().optional(),
  policyTextLocale: z.string().trim().max(10).optional(),
});

export const createHostListingSchema = z.object({
  title: z.string().trim().min(2).max(200),
  titleKo: optionalTrimmedString,
  titleJa: optionalTrimmedString,
  titleZh: optionalTrimmedString,
  city: z.string().trim().min(2).max(100),
  area: z.string().trim().min(1).max(100),
  address: z.string().trim().min(5).max(300),
  basePriceKrw: z.coerce.number().int().positive(),
  checkInTime: z.string().trim().regex(/^\d{2}:\d{2}$/).optional(),
  checkOutTime: z.string().trim().regex(/^\d{2}:\d{2}$/).optional(),
  hostBio: optionalTrimmedString,
  hostBioKo: optionalTrimmedString,
  hostBioJa: optionalTrimmedString,
  hostBioZh: optionalTrimmedString,
  status: z.enum(["DRAFT", "PENDING"]).optional(),
});

export const updateHostListingSchema = z
  .object({
    title: z.string().trim().min(2).max(200).optional(),
    titleKo: optionalTrimmedString,
    titleJa: optionalTrimmedString,
    titleZh: optionalTrimmedString,
    city: z.string().trim().min(2).max(100).optional(),
    area: z.string().trim().min(1).max(100).optional(),
    address: z.string().trim().min(5).max(300).optional(),
    basePriceKrw: z.coerce.number().int().positive().optional(),
    extraGuestFeeKrw: z.coerce.number().int().min(0).optional().nullable(),
    status: z.enum(["DRAFT", "PENDING", "APPROVED", "REJECTED"]).optional(),
    checkInTime: z.string().trim().regex(/^\d{2}:\d{2}$/).optional().nullable(),
    checkOutTime: z.string().trim().regex(/^\d{2}:\d{2}$/).optional().nullable(),
    checkInGuideMessage: z.string().trim().max(3000).optional().nullable(),
    houseRulesMessage: z.string().trim().max(3000).optional().nullable(),
    hostBio: optionalTrimmedString,
    hostBioKo: optionalTrimmedString,
    hostBioJa: optionalTrimmedString,
    hostBioZh: optionalTrimmedString,
    lat: z.coerce.number().finite().optional().nullable(),
    lng: z.coerce.number().finite().optional().nullable(),
    amenities: z.array(z.string().trim().min(1)).optional(),
    propertyType: z.string().trim().max(50).optional().nullable(),
    maxGuests: z.coerce.number().int().min(1).max(20).optional().nullable(),
    country: z.string().trim().max(50).optional().nullable(),
    stateProvince: z.string().trim().max(100).optional().nullable(),
    cityDistrict: z.string().trim().max(100).optional().nullable(),
    roadAddress: z.string().trim().max(300).optional().nullable(),
    detailedAddress: z.string().trim().max(500).optional().nullable(),
    zipCode: z.string().trim().max(20).optional().nullable(),
    weekendSurchargePct: z.coerce.number().int().min(0).max(100).optional().nullable(),
    peakSurchargePct: z.coerce.number().int().min(0).max(100).optional().nullable(),
    nonRefundableSpecialEnabled: z.boolean().optional(),
    freeCancellationDays: z.coerce.number().int().min(0).max(14).optional().nullable(),
    businessRegistrationDocUrl: z.string().trim().url().max(2000).optional().nullable().or(z.literal("")),
    lodgingReportDocUrl: z.string().trim().url().max(2000).optional().nullable().or(z.literal("")),
  })
  .strict()
  .refine(
    (data) => {
      if (!Array.isArray(data.amenities)) return true;
      const allowed = new Set<string>(AMENITY_KEYS as unknown as string[]);
      return data.amenities.every((key: string) => allowed.has(key));
    },
    { message: "amenities에는 정의된 어메니티 키만 입력할 수 있습니다.", path: ["amenities"] }
  );

export const wishlistMutationSchema = z.object({
  listingId: z.string().trim().min(1, "listingId is required"),
});

export const addListingImageSchema = z.object({
  url: z.string().trim().url("Valid image URL required"),
  sortOrder: z.coerce.number().int().min(0).optional(),
});

export const reorderListingImagesSchema = z.object({
  imageIds: z.array(z.string().trim().min(1)).min(1, "At least one image id required"),
});

export const updateProfileSchema = z.object({
  displayName: z.string().trim().max(100).optional().nullable(),
  profilePhotoUrl: z.string().trim().max(500000).optional().nullable(), // base64 data URL 허용
});

const categoryRating = z.coerce.number().int().min(1).max(5);

export const createReviewSchema = z.object({
  bookingId: z.string().trim().min(1, "bookingId is required"),
  body: z.string().trim().min(1, "Review text is required").max(2000),
  cleanliness: categoryRating,
  accuracy: categoryRating,
  checkIn: categoryRating,
  communication: categoryRating,
  location: categoryRating,
  value: categoryRating,
});

/** 관리자 테스트 리뷰: listingId로 해당 숙소에 리뷰 1개 생성 (테스트용 예약 자동 생성) */
export const adminCreateReviewSchema = z.object({
  listingId: z.string().trim().min(1, "listingId is required"),
  body: z.string().trim().min(1, "Review text is required").max(2000),
  cleanliness: categoryRating,
  accuracy: categoryRating,
  checkIn: categoryRating,
  communication: categoryRating,
  location: categoryRating,
  value: categoryRating,
});
