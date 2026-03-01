import { prisma } from "@/lib/db";

export type Lang = "en" | "ko" | "ja" | "zh";

export type BoardPostI18n = Record<Lang, string>;

export type BoardPostRecord = {
  id: string;
  cover: string;
  title: BoardPostI18n;
  excerpt: BoardPostI18n;
  content: BoardPostI18n;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
};

function rowToPost(row: { id: string; cover: string; title: unknown; excerpt: unknown; content: unknown; sortOrder: number; createdAt: Date; updatedAt: Date }): BoardPostRecord {
  const title = (row.title as BoardPostI18n) ?? { en: "", ko: "", ja: "", zh: "" };
  const excerpt = (row.excerpt as BoardPostI18n) ?? { en: "", ko: "", ja: "", zh: "" };
  const content = (row.content as BoardPostI18n) ?? { en: "", ko: "", ja: "", zh: "" };
  return {
    id: row.id,
    cover: row.cover,
    title,
    excerpt,
    content,
    sortOrder: row.sortOrder,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

/** 게스트 게시판 목록 (노출 순서·최신순) */
export async function getBoardPosts(): Promise<BoardPostRecord[]> {
  const rows = await prisma.boardPost.findMany({
    orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
  });
  return rows.map(rowToPost);
}

/** 게스트 게시판 단일 글 */
export async function getBoardPostById(id: string): Promise<BoardPostRecord | null> {
  const row = await prisma.boardPost.findUnique({ where: { id } });
  return row ? rowToPost(row) : null;
}

export type CreateBoardPostInput = {
  cover: string;
  title: BoardPostI18n;
  excerpt: BoardPostI18n;
  content: BoardPostI18n;
  sortOrder?: number;
};

/** admin: 게시판 글 생성 */
export async function createBoardPost(input: CreateBoardPostInput): Promise<BoardPostRecord> {
  const row = await prisma.boardPost.create({
    data: {
      cover: input.cover,
      title: input.title as object,
      excerpt: input.excerpt as object,
      content: input.content as object,
      sortOrder: input.sortOrder ?? 0,
    },
  });
  return rowToPost(row);
}

export type UpdateBoardPostInput = Partial<CreateBoardPostInput>;

/** admin: 게시판 글 수정 */
export async function updateBoardPost(id: string, input: UpdateBoardPostInput): Promise<BoardPostRecord | null> {
  const row = await prisma.boardPost.update({
    where: { id },
    data: {
      ...(input.cover != null && { cover: input.cover }),
      ...(input.title != null && { title: input.title as object }),
      ...(input.excerpt != null && { excerpt: input.excerpt as object }),
      ...(input.content != null && { content: input.content as object }),
      ...(input.sortOrder != null && { sortOrder: input.sortOrder }),
    },
  }).catch(() => null);
  return row ? rowToPost(row) : null;
}

/** admin: 게시판 글 삭제 */
export async function deleteBoardPost(id: string): Promise<boolean> {
  await prisma.boardPost.delete({ where: { id } }).catch(() => null);
  return true;
}
