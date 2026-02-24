import { z } from "zod";

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
    status: z.enum(["DRAFT", "PENDING", "APPROVED", "REJECTED"]).optional(),
    checkInTime: z.string().trim().regex(/^\d{2}:\d{2}$/).optional().nullable(),
    checkOutTime: z.string().trim().regex(/^\d{2}:\d{2}$/).optional().nullable(),
    hostBio: optionalTrimmedString,
    hostBioKo: optionalTrimmedString,
    hostBioJa: optionalTrimmedString,
    hostBioZh: optionalTrimmedString,
    lat: z.coerce.number().finite().optional().nullable(),
    lng: z.coerce.number().finite().optional().nullable(),
    amenities: z.array(z.string().trim().min(1)).optional(),
  })
  .strict();

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

export const createReviewSchema = z.object({
  bookingId: z.string().trim().min(1, "bookingId is required"),
  rating: z.coerce.number().int().min(1).max(5),
  body: z.string().trim().min(1, "Review text is required").max(2000),
});
