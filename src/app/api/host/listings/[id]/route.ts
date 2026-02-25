import { getOrCreateServerUser } from "@/lib/auth/server";
import { apiError, apiOk } from "@/lib/api/response";
import { parseJsonBody } from "@/lib/api/validation";
import { updateHostListingSchema } from "@/lib/validation/schemas";
import {
  deleteHostListing,
  findHostListingForEdit,
  findHostListingOwnership,
  updateHostListing,
} from "@/lib/repositories/host-listings";

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const user = await getOrCreateServerUser();
    if (!user) return apiError(401, "UNAUTHORIZED", "Login required");
    if (user.role !== "HOST" && user.role !== "ADMIN") {
      return apiError(403, "FORBIDDEN", "Host role required");
    }

    const { id } = await ctx.params;
    if (!id) return apiError(400, "BAD_REQUEST", "listing id is required");

    const listing = await findHostListingForEdit(
      id,
      user.role === "ADMIN" ? undefined : user.id
    );
    if (!listing) return apiError(404, "NOT_FOUND", "Listing not found");
    return apiOk(listing);
  } catch (error) {
    console.error("[api/host/listings/:id] GET failed", error);
    const message = error instanceof Error ? error.message : "Failed to load listing";
    return apiError(500, "INTERNAL_ERROR", message);
  }
}

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const user = await getOrCreateServerUser();
    if (!user) return apiError(401, "UNAUTHORIZED", "Login required");
    if (user.role !== "HOST" && user.role !== "ADMIN") {
      return apiError(403, "FORBIDDEN", "Host role required");
    }

    const { id } = await ctx.params;
    if (!id) return apiError(400, "BAD_REQUEST", "listing id is required");

    const current = await findHostListingOwnership(id);
    if (!current) return apiError(404, "NOT_FOUND", "Listing not found");
    if (user.role !== "ADMIN" && current.hostId !== user.id) {
      return apiError(403, "FORBIDDEN", "You cannot modify this listing");
    }

    const parsedBody = await parseJsonBody(req, updateHostListingSchema);
    if (!parsedBody.ok) return parsedBody.response;
    const body = parsedBody.data;

    if (body.status === "PENDING") {
      const existing = await findHostListingForEdit(id, current.hostId);
      if (!existing) return apiError(404, "NOT_FOUND", "Listing not found");
      const effectiveTitle = (body.title ?? existing.title)?.trim() || (body.titleKo ?? existing.titleKo)?.trim() || (body.titleJa ?? existing.titleJa)?.trim() || (body.titleZh ?? existing.titleZh)?.trim();
      const effectiveCity = (body.city ?? existing.city)?.trim();
      const effectiveArea = (body.area ?? existing.area)?.trim();
      const effectiveAddress = (body.address ?? existing.address)?.trim();
      const effectiveBasePriceKrw = body.basePriceKrw ?? existing.basePriceKrw;
      const imageCount = Array.isArray(existing.images) ? existing.images.length : 0;
      if (!effectiveTitle || effectiveTitle.length < 2) {
        return apiError(400, "VALIDATION_ERROR", "제목(또는 titleKo/titleJa/titleZh 중 하나)을 2자 이상 입력해 주세요.");
      }
      if (!effectiveCity || !effectiveArea || !effectiveAddress) {
        return apiError(400, "VALIDATION_ERROR", "도시(city), 지역(area), 주소(address)를 모두 입력해 주세요.");
      }
      if (typeof effectiveBasePriceKrw !== "number" || effectiveBasePriceKrw <= 0) {
        return apiError(400, "VALIDATION_ERROR", "1박 기준가(basePriceKrw)를 0보다 큰 값으로 입력해 주세요.");
      }
      if (imageCount < 5) {
        return apiError(400, "VALIDATION_ERROR", "사진을 5장 이상 등록해 주세요.");
      }
    }

    const isApproved = current.status === "APPROVED";
    const payload: Parameters<typeof updateHostListing>[0] = { id };
    if (isApproved) {
      payload.checkInGuideMessage = body.checkInGuideMessage;
      payload.houseRulesMessage = body.houseRulesMessage;
      payload.detailedAddress = body.detailedAddress;
    } else {
      Object.assign(payload, {
        title: body.title,
        titleKo: body.titleKo,
        titleJa: body.titleJa,
        titleZh: body.titleZh,
        city: body.city,
        area: body.area,
        address: body.address,
        basePriceKrw: body.basePriceKrw,
        status: body.status,
        checkInTime: body.checkInTime,
        checkOutTime: body.checkOutTime,
        checkInGuideMessage: body.checkInGuideMessage,
        houseRulesMessage: body.houseRulesMessage,
        hostBio: body.hostBio,
        hostBioKo: body.hostBioKo,
        hostBioJa: body.hostBioJa,
        hostBioZh: body.hostBioZh,
        lat: body.lat,
        lng: body.lng,
        amenities: body.amenities,
        propertyType: body.propertyType,
        maxGuests: body.maxGuests,
        country: body.country,
        stateProvince: body.stateProvince,
        cityDistrict: body.cityDistrict,
        roadAddress: body.roadAddress,
        detailedAddress: body.detailedAddress,
        zipCode: body.zipCode,
        weekendSurchargePct: body.weekendSurchargePct,
        peakSurchargePct: body.peakSurchargePct,
        nonRefundableSpecialEnabled: body.nonRefundableSpecialEnabled,
        freeCancellationDays: body.freeCancellationDays,
        extraGuestFeeKrw: body.extraGuestFeeKrw,
        businessRegistrationDocUrl: (body.businessRegistrationDocUrl?.trim() || null) ?? null,
        lodgingReportDocUrl: (body.lodgingReportDocUrl?.trim() || null) ?? null,
      });
    }

    const updated = await updateHostListing(payload);

    return apiOk(updated);
  } catch (error) {
    console.error("[api/host/listings/:id] failed to update listing", error);
    const message = error instanceof Error ? error.message : "Failed to update listing";
    return apiError(500, "INTERNAL_ERROR", message);
  }
}

export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const user = await getOrCreateServerUser();
    if (!user) return apiError(401, "UNAUTHORIZED", "Login required");
    if (user.role !== "HOST" && user.role !== "ADMIN") {
      return apiError(403, "FORBIDDEN", "Host role required");
    }

    const { id } = await ctx.params;
    if (!id) return apiError(400, "BAD_REQUEST", "listing id is required");

    const current = await findHostListingOwnership(id);
    if (!current) return apiError(404, "NOT_FOUND", "Listing not found");
    if (user.role !== "ADMIN" && current.hostId !== user.id) {
      return apiError(403, "FORBIDDEN", "You cannot delete this listing");
    }

    const result = await deleteHostListing(id, current.hostId);
    if (!result.ok) {
      if (result.code === "NOT_FOUND") return apiError(404, "NOT_FOUND", result.message);
      if (result.code === "HAS_BOOKINGS") return apiError(409, "CONFLICT", result.message);
      return apiError(400, "BAD_REQUEST", result.message);
    }
    return apiOk({ deleted: true });
  } catch (error) {
    console.error("[api/host/listings/:id] DELETE failed", error);
    const message = error instanceof Error ? error.message : "Failed to delete listing";
    return apiError(500, "INTERNAL_ERROR", message);
  }
}
