import { apiError, apiOk } from "@/lib/api/response";
import { requireAdmin } from "@/lib/api/auth-guard";
import { createPromotionForAdmin, getAdminPromotions } from "@/lib/repositories/listing-promotions";

export async function GET(req: Request) {
  try {
    const auth = await requireAdmin();
    if (!auth.ok) return auth.response;
    const admin = auth.user;

    const url = new URL(req.url);
    const status = url.searchParams.get("status");
    const placement = url.searchParams.get("placement");
    const listingId = url.searchParams.get("listingId");
    const page = Number(url.searchParams.get("page") ?? "1") || 1;
    const pageSize = Number(url.searchParams.get("pageSize") ?? "20") || 20;

    const { rows, total } = await getAdminPromotions({
      status,
      placement,
      listingId,
      page,
      pageSize,
    });

    const serialized = rows.map((p) => ({
      id: p.id,
      listing: p.listing,
      placement: p.placement,
      status: p.status,
      priority: p.priority,
      startAt: p.startAt.toISOString(),
      endAt: p.endAt.toISOString(),
      amountKrw: p.amountKrw,
      currency: p.currency,
      memo: p.memo,
      createdAt: p.createdAt.toISOString(),
    }));

    return apiOk({ items: serialized, total, page, pageSize });
  } catch (err) {
    console.error("[api/admin/promotions] GET failed", err);
    return apiError(500, "INTERNAL_ERROR", "Failed to fetch promotions");
  }
}

export async function POST(req: Request) {
  try {
    const auth = await requireAdmin();
    if (!auth.ok) return auth.response;
    const admin = auth.user;

    const body = await req.json().catch(() => ({}));

    const listingId = typeof body.listingId === "string" ? body.listingId.trim() : "";
    const placement = typeof body.placement === "string" ? body.placement.trim() : "";
    const rawStartAt = typeof body.startAt === "string" ? body.startAt.trim() : "";
    const rawEndAt = typeof body.endAt === "string" ? body.endAt.trim() : "";
    const rawPriority = typeof body.priority === "number" ? body.priority : Number(body.priority);
    const rawAmount =
      typeof body.amountKrw === "number" ? body.amountKrw : Number(body.amountKrw);
    const memo = typeof body.memo === "string" ? body.memo : null;

    if (!listingId) return apiError(400, "BAD_REQUEST", "listingId required");
    if (!placement) return apiError(400, "BAD_REQUEST", "placement required");
    if (!rawStartAt || !rawEndAt) {
      return apiError(400, "BAD_REQUEST", "startAt and endAt required");
    }

    const allowedPlacements = new Set([
      "HOME_RECOMMENDED",
      "HOME_HANOK",
      "HOME_KSTAY_BLACK",
    ]);
    if (!allowedPlacements.has(placement)) {
      return apiError(400, "BAD_REQUEST", "Invalid placement");
    }

    const startAt = new Date(rawStartAt);
    const endAt = new Date(rawEndAt);
    if (!Number.isFinite(startAt.getTime()) || !Number.isFinite(endAt.getTime())) {
      return apiError(400, "BAD_REQUEST", "Invalid startAt/endAt");
    }
    if (endAt <= startAt) {
      return apiError(400, "BAD_REQUEST", "endAt must be after startAt");
    }

    const priority = Number.isFinite(rawPriority) ? Math.max(0, Math.trunc(rawPriority)) : 0;
    const amountKrw =
      Number.isFinite(rawAmount) && rawAmount >= 0 ? Math.trunc(rawAmount) : null;

    const promo = await createPromotionForAdmin({
      listingId,
      placement: placement as "HOME_RECOMMENDED" | "HOME_HANOK" | "HOME_KSTAY_BLACK",
      startAt,
      endAt,
      priority,
      amountKrw,
      memo,
    });

    const serialized = {
      id: promo.id,
      listing: promo.listing,
      placement: promo.placement,
      status: promo.status,
      priority: promo.priority,
      startAt: promo.startAt.toISOString(),
      endAt: promo.endAt.toISOString(),
      amountKrw: promo.amountKrw,
      currency: promo.currency,
      memo: promo.memo,
      createdAt: promo.createdAt.toISOString(),
    };

    return apiOk(serialized, 201);
  } catch (err) {
    console.error("[api/admin/promotions] POST failed", err);
    return apiError(500, "INTERNAL_ERROR", "Failed to create promotion");
  }
}

