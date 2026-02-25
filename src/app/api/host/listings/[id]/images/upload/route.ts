import { mkdir, writeFile } from "fs/promises";
import path from "path";
import imageSize from "image-size";
import { getOrCreateServerUser } from "@/lib/auth/server";
import { apiError, apiOk } from "@/lib/api/response";
import { findHostListingOwnership, countListingImages } from "@/lib/repositories/host-listings";

/** 글로벌 표준: 최대 20MB (VRBO·부킹닷컴 등) */
const MAX_SIZE = 20 * 1024 * 1024;
/** 최소 해상도 1024×683 (에어비앤비·VRBO 등) */
const MIN_WIDTH = 1024;
const MIN_HEIGHT = 683;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

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

    const currentCount = await countListingImages(listingId);
    if (currentCount >= 20) {
      return apiError(400, "VALIDATION_ERROR", "이미지는 최대 20장까지 등록할 수 있습니다.");
    }

    const formData = await req.formData();
    const file = formData.get("file") ?? formData.get("image");
    if (!file || !(file instanceof File)) {
      return apiError(400, "BAD_REQUEST", "file or image 필드에 이미지 파일을 넣어 주세요.");
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return apiError(400, "VALIDATION_ERROR", "JPEG, PNG, WebP, GIF만 업로드할 수 있습니다.");
    }
    if (file.size > MAX_SIZE) {
      return apiError(400, "VALIDATION_ERROR", "파일 크기는 20MB 이하여야 합니다.");
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    try {
      const dimensions = imageSize(buffer);
      const w = dimensions.width ?? 0;
      const h = dimensions.height ?? 0;
      if (w < MIN_WIDTH || h < MIN_HEIGHT) {
        return apiError(
          400,
          "VALIDATION_ERROR",
          `이미지 해상도는 최소 ${MIN_WIDTH}×${MIN_HEIGHT} 픽셀 이상이어야 합니다. (현재: ${w}×${h})`
        );
      }
    } catch {
      return apiError(400, "VALIDATION_ERROR", "이미지 파일을 읽을 수 없습니다. 형식을 확인해 주세요.");
    }

    const ext = path.extname(file.name) || (file.type === "image/png" ? ".png" : ".jpg");
    const filename = `${listingId}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}${ext}`;
    const uploadDir = path.join(process.cwd(), "public", "uploads");
    await mkdir(uploadDir, { recursive: true });
    const filePath = path.join(uploadDir, filename);
    await writeFile(filePath, buffer);

    const url = `/uploads/${filename}`;
    return apiOk({ url }, 201);
  } catch (error) {
    console.error("[api/host/listings/:id/images/upload] POST failed", error);
    return apiError(500, "INTERNAL_ERROR", "Failed to upload image");
  }
}
