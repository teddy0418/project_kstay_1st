import path from "path";
import { getOrCreateServerUser } from "@/lib/auth/server";
import { apiError, apiOk } from "@/lib/api/response";
import { findHostListingOwnership } from "@/lib/repositories/host-listings";
import { uploadDocument } from "@/lib/storage/documents";

const MAX_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
const DOC_TYPES = ["business_registration", "lodging_report"] as const;

export async function POST(
  req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getOrCreateServerUser();
    if (!user) return apiError(401, "UNAUTHORIZED", "Login required");
    if (user.role !== "HOST" && user.role !== "ADMIN") {
      return apiError(403, "FORBIDDEN", "Host role required");
    }

    const { id: listingId } = await ctx.params;
    if (!listingId) return apiError(400, "BAD_REQUEST", "listing id is required");

    const ownership = await findHostListingOwnership(listingId);
    if (!ownership) return apiError(404, "NOT_FOUND", "Listing not found");
    if (user.role !== "ADMIN" && ownership.hostId !== user.id) {
      return apiError(403, "FORBIDDEN", "You cannot modify this listing");
    }

    const formData = await req.formData();
    const typeRaw = formData.get("type");
    const type = DOC_TYPES.includes(typeRaw as (typeof DOC_TYPES)[number])
      ? (typeRaw as (typeof DOC_TYPES)[number])
      : null;
    if (!type) {
      return apiError(400, "BAD_REQUEST", "type는 business_registration 또는 lodging_report 이어야 합니다.");
    }

    const file = formData.get("file") ?? formData.get("image");
    if (!file || !(file instanceof File)) {
      return apiError(400, "BAD_REQUEST", "file 또는 image 필드에 파일을 넣어 주세요.");
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return apiError(400, "VALIDATION_ERROR", "JPEG, PNG, WebP, PDF만 업로드할 수 있습니다.");
    }
    if (file.size > MAX_SIZE) {
      return apiError(400, "VALIDATION_ERROR", "파일 크기는 10MB 이하여야 합니다.");
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const rawExt = path.extname(file.name)?.toLowerCase() || (file.type === "application/pdf" ? ".pdf" : ".jpg");
    const safeExt = [".pdf", ".jpg", ".jpeg", ".png", ".webp"].includes(rawExt) ? rawExt : ".jpg";
    const filename = `${listingId}-${type}-${Date.now()}${safeExt}`;
    const { url } = await uploadDocument(buffer, filename, file.type);
    return apiOk({ url }, 201);
  } catch (error) {
    console.error("[api/host/listings/:id/documents/upload] POST failed", error);
    return apiError(500, "INTERNAL_ERROR", "Failed to upload document");
  }
}
