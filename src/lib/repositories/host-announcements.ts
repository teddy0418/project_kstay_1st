import { prisma } from "@/lib/db";

export type HostAnnouncementType = "공지" | "팁" | "가이드";

export type HostAnnouncementRecord = {
  id: string;
  type: string;
  title: string;
  body: string | null;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
};

/** 호스트 대시보드 KSTAY 센터용 공지 목록 (sortOrder·최신순) */
export async function getHostAnnouncements(): Promise<HostAnnouncementRecord[]> {
  const delegate = (prisma as { hostAnnouncement?: { findMany: (args: unknown) => Promise<Array<HostAnnouncementRecord>> } }).hostAnnouncement;
  if (!delegate) {
    return [];
  }
  const rows = await delegate.findMany({
    orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
  });
  return Array.isArray(rows) ? rows.map((r) => ({
    id: r.id,
    type: r.type,
    title: r.title,
    body: r.body,
    sortOrder: r.sortOrder,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
  })) : [];
}

/** 단일 공지 조회 */
export async function getHostAnnouncementById(id: string): Promise<HostAnnouncementRecord | null> {
  const row = await prisma.hostAnnouncement.findUnique({ where: { id } });
  if (!row) return null;
  return {
    id: row.id,
    type: row.type,
    title: row.title,
    body: row.body,
    sortOrder: row.sortOrder,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export type CreateHostAnnouncementInput = {
  type: string;
  title: string;
  body?: string | null;
  sortOrder?: number;
};

export async function createHostAnnouncement(input: CreateHostAnnouncementInput): Promise<HostAnnouncementRecord> {
  const row = await prisma.hostAnnouncement.create({
    data: {
      type: input.type.trim(),
      title: input.title.trim(),
      body: input.body?.trim() || null,
      sortOrder: typeof input.sortOrder === "number" ? input.sortOrder : 0,
    },
  });
  return {
    id: row.id,
    type: row.type,
    title: row.title,
    body: row.body,
    sortOrder: row.sortOrder,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export type UpdateHostAnnouncementInput = Partial<CreateHostAnnouncementInput>;

export async function updateHostAnnouncement(id: string, input: UpdateHostAnnouncementInput): Promise<HostAnnouncementRecord | null> {
  const data: { type?: string; title?: string; body?: string | null; sortOrder?: number } = {};
  if (input.type !== undefined) data.type = input.type.trim();
  if (input.title !== undefined) data.title = input.title.trim();
  if (input.body !== undefined) data.body = input.body?.trim() || null;
  if (input.sortOrder !== undefined) data.sortOrder = input.sortOrder;

  const row = await prisma.hostAnnouncement.update({
    where: { id },
    data,
  });
  return {
    id: row.id,
    type: row.type,
    title: row.title,
    body: row.body,
    sortOrder: row.sortOrder,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export async function deleteHostAnnouncement(id: string): Promise<boolean> {
  await prisma.hostAnnouncement.delete({ where: { id } });
  return true;
}
