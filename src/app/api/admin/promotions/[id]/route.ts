import { apiError, apiOk } from "@/lib/api/response";
import { requireAdmin } from "@/lib/api/auth-guard";
import { updatePromotionForAdmin } from "@/lib/repositories/listing-promotions";

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireAdmin();
    if (!auth.ok) return auth.response;
    const admin = auth.user;

    const { id } = await ctx.params;
    if (!id) return apiError(400, "BAD_REQUEST", "id required");

    const body = await req.json().catch(() => ({}));

    const patch: {
      placement?: "HOME_RECOMMENDED" | "HOME_HANOK" | "HOME_KSTAY_BLACK";
      startAt?: Date;
      endAt?: Date;
      priority?: number;
      amountKrw?: number | null;
      memo?: string | null;
      status?: "PENDING" | "ACTIVE" | "ENDED" | "CANCELLED";
    } = {};

    if (typeof body.placement === "string") {
      const p = body.placement.trim();
      if (["HOME_RECOMMENDED", "HOME_HANOK", "HOME_KSTAY_BLACK"].includes(p)) {
        patch.placement = p as typeof patch.placement;
      }
    }

    const parseDate = (v: unknown): Date | null => {
      if (typeof v !== "string" || !v.trim()) return null;
      const d = new Date(v.trim());
      return Number.isFinite(d.getTime()) ? d : null;
    };

    const startAt = parseDate(body.startAt);
    const endAt = parseDate(body.endAt);
    if (startAt) patch.startAt = startAt;
    if (endAt) patch.endAt = endAt;
    if (startAt && endAt && endAt <= startAt) {
      return apiError(400, "BAD_REQUEST", "endAt must be after startAt");
    }

    if (body.priority != null) {
      const rawPriority =
        typeof body.priority === "number" ? body.priority : Number(body.priority);
      if (Number.isFinite(rawPriority)) {
        patch.priority = Math.max(0, Math.trunc(rawPriority));
      }
    }

    if (body.amountKrw !== undefined) {
      const rawAmount =
        typeof body.amountKrw === "number" ? body.amountKrw : Number(body.amountKrw);
      patch.amountKrw =
        Number.isFinite(rawAmount) && rawAmount >= 0 ? Math.trunc(rawAmount) : null;
    }

    if (body.memo !== undefined) {
      patch.memo = typeof body.memo === "string" ? body.memo : null;
    }

    if (typeof body.status === "string") {
      const s = body.status.trim();
      if (["PENDING", "ACTIVE", "ENDED", "CANCELLED"].includes(s)) {
        patch.status = s as typeof patch.status;
      }
    }

    const updated = await updatePromotionForAdmin(id, patch);
    if (!updated) return apiError(404, "NOT_FOUND", "Promotion not found");

    const serialized = {
      id: updated.id,
      listing: updated.listing,
      placement: updated.placement,
      status: updated.status,
      priority: updated.priority,
      startAt: updated.startAt.toISOString(),
      endAt: updated.endAt.toISOString(),
      amountKrw: updated.amountKrw,
      currency: updated.currency,
      memo: updated.memo,
      createdAt: updated.createdAt.toISOString(),
    };

    return apiOk(serialized);
  } catch (err) {
    console.error("[api/admin/promotions/:id] PATCH failed", err);
    return apiError(500, "INTERNAL_ERROR", "Failed to update promotion");
  }
}

