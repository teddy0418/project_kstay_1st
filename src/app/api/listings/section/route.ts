import { getPublicListingsBySection, type SectionType } from "@/lib/repositories/listings";
import { apiOk, apiError } from "@/lib/api/response";

const VALID_SECTIONS: SectionType[] = ["recommended", "hanok", "kstay-black"];

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const section = url.searchParams.get("section")?.trim();
    const cursor = url.searchParams.get("cursor")?.trim() || null;
    const limitParam = url.searchParams.get("limit");
    const limit = limitParam ? Math.min(20, Math.max(1, parseInt(limitParam, 10) || 10)) : 10;

    if (!section || !VALID_SECTIONS.includes(section as SectionType)) {
      return apiError(400, "BAD_REQUEST", "section must be one of: recommended, hanok, kstay-black");
    }

    const result = await getPublicListingsBySection(section as SectionType, cursor, limit);
    return apiOk(result);
  } catch {
    return apiError(500, "INTERNAL_ERROR", "Failed to fetch section listings");
  }
}
