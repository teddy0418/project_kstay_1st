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
});

export const createHostListingSchema = z.object({
  title: z.string().trim().min(2).max(200),
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
});

export const updateHostListingSchema = z
  .object({
    title: z.string().trim().min(2).max(200).optional(),
    city: z.string().trim().min(2).max(100).optional(),
    area: z.string().trim().min(1).max(100).optional(),
    address: z.string().trim().min(5).max(300).optional(),
    basePriceKrw: z.coerce.number().int().positive().optional(),
    status: z.enum(["PENDING", "APPROVED", "REJECTED"]).optional(),
    hostBio: optionalTrimmedString,
    hostBioKo: optionalTrimmedString,
    hostBioJa: optionalTrimmedString,
    hostBioZh: optionalTrimmedString,
  })
  .strict();

export const wishlistMutationSchema = z.object({
  listingId: z.string().trim().min(1, "listingId is required"),
});
