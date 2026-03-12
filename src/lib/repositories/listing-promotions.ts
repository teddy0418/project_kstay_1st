import { prisma } from "@/lib/db";

export type AdminPromotionRow = {
  id: string;
  listing: { id: string; title: string };
  placement: "HOME_RECOMMENDED" | "HOME_HANOK" | "HOME_KSTAY_BLACK";
  status: "PENDING" | "ACTIVE" | "ENDED" | "CANCELLED";
  priority: number;
  startAt: Date;
  endAt: Date;
  amountKrw: number | null;
  currency: string | null;
  memo: string | null;
  createdAt: Date;
};

type BaseWhere = {
  status?: AdminPromotionRow["status"];
  placement?: AdminPromotionRow["placement"];
  listingId?: string;
};

export async function getAdminPromotions(params: {
  status?: string | null;
  placement?: string | null;
  listingId?: string | null;
  page?: number;
  pageSize?: number;
}): Promise<{ rows: AdminPromotionRow[]; total: number }> {
  const { status, placement, listingId, page = 1, pageSize = 20 } = params;

  const where: BaseWhere = {};
  const allowedStatus = new Set<AdminPromotionRow["status"]>([
    "PENDING",
    "ACTIVE",
    "ENDED",
    "CANCELLED",
  ]);
  const allowedPlacement = new Set<AdminPromotionRow["placement"]>([
    "HOME_RECOMMENDED",
    "HOME_HANOK",
    "HOME_KSTAY_BLACK",
  ]);
  if (status && allowedStatus.has(status as AdminPromotionRow["status"])) {
    where.status = status as AdminPromotionRow["status"];
  }
  if (placement && allowedPlacement.has(placement as AdminPromotionRow["placement"])) {
    where.placement = placement as AdminPromotionRow["placement"];
  }
  if (listingId) where.listingId = listingId;

  const take = Math.max(1, Math.min(100, pageSize));
  const skip = Math.max(0, (page - 1) * take);

  const [rows, total] = await Promise.all([
    prisma.listingPromotion.findMany({
      where,
      include: { listing: { select: { id: true, title: true } } },
      orderBy: [{ createdAt: "desc" }, { startAt: "desc" }],
      skip,
      take,
    }),
    prisma.listingPromotion.count({ where }),
  ]);

  return {
    rows: rows.map((r) => ({
      id: r.id,
      listing: { id: r.listing.id, title: r.listing.title },
      placement: r.placement as AdminPromotionRow["placement"],
      status: r.status as AdminPromotionRow["status"],
      priority: r.priority,
      startAt: r.startAt,
      endAt: r.endAt,
      amountKrw: r.amountKrw ?? null,
      currency: r.currency ?? null,
      memo: r.memo ?? null,
      createdAt: r.createdAt,
    })),
    total,
  };
}

export async function getLatestPromotionByListing(
  listingId: string
): Promise<AdminPromotionRow | null> {
  if (!listingId) return null;
  const row = await prisma.listingPromotion.findFirst({
    where: { listingId },
    include: { listing: { select: { id: true, title: true } } },
    orderBy: [{ createdAt: "desc" }, { startAt: "desc" }],
  });
  if (!row) return null;
  return {
    id: row.id,
    listing: { id: row.listing.id, title: row.listing.title },
    placement: row.placement as AdminPromotionRow["placement"],
    status: row.status as AdminPromotionRow["status"],
    priority: row.priority,
    startAt: row.startAt,
    endAt: row.endAt,
    amountKrw: row.amountKrw ?? null,
    currency: row.currency ?? null,
    memo: row.memo ?? null,
    createdAt: row.createdAt,
  };
}

type CreateInput = {
  listingId: string;
  placement: AdminPromotionRow["placement"];
  startAt: Date;
  endAt: Date;
  priority: number;
  amountKrw?: number | null;
  memo?: string | null;
};

export async function createPromotionForAdmin(input: CreateInput): Promise<AdminPromotionRow> {
  const { listingId, placement, startAt, endAt, priority, amountKrw, memo } = input;
  const row = await prisma.listingPromotion.create({
    data: {
      listingId,
      placement,
      startAt,
      endAt,
      priority,
      amountKrw: amountKrw ?? null,
      memo: memo ?? null,
      status: "ACTIVE",
    },
    include: { listing: { select: { id: true, title: true } } },
  });
  return {
    id: row.id,
    listing: { id: row.listing.id, title: row.listing.title },
    placement: row.placement as AdminPromotionRow["placement"],
    status: row.status as AdminPromotionRow["status"],
    priority: row.priority,
    startAt: row.startAt,
    endAt: row.endAt,
    amountKrw: row.amountKrw ?? null,
    currency: row.currency ?? null,
    memo: row.memo ?? null,
    createdAt: row.createdAt,
  };
}

type UpdateInput = {
  placement?: AdminPromotionRow["placement"];
  startAt?: Date;
  endAt?: Date;
  priority?: number;
  amountKrw?: number | null;
  memo?: string | null;
  status?: AdminPromotionRow["status"];
};

export async function updatePromotionForAdmin(
  id: string,
  input: UpdateInput
): Promise<AdminPromotionRow | null> {
  if (!id) return null;
  const data: Record<string, unknown> = {};
  if (input.placement) data.placement = input.placement;
  if (input.startAt) data.startAt = input.startAt;
  if (input.endAt) data.endAt = input.endAt;
  if (typeof input.priority === "number") data.priority = input.priority;
  if (input.amountKrw !== undefined) data.amountKrw = input.amountKrw;
  if (input.memo !== undefined) data.memo = input.memo;
  if (input.status) data.status = input.status;

  const row = await prisma.listingPromotion.update({
    where: { id },
    data,
    include: { listing: { select: { id: true, title: true } } },
  });
  return {
    id: row.id,
    listing: { id: row.listing.id, title: row.listing.title },
    placement: row.placement as AdminPromotionRow["placement"],
    status: row.status as AdminPromotionRow["status"],
    priority: row.priority,
    startAt: row.startAt,
    endAt: row.endAt,
    amountKrw: row.amountKrw ?? null,
    currency: row.currency ?? null,
    memo: row.memo ?? null,
    createdAt: row.createdAt,
  };
}

