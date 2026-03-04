import type { Metadata } from "next";
import { getServerLang } from "@/lib/i18n/server";
import { getBoardPostById } from "@/lib/repositories/board";
import BoardDetailPageClient from "./BoardDetailPageClient";

type Lang = "en" | "ko" | "ja" | "zh";

function firstNonEmpty(obj: Record<Lang, string>, preferred: Lang): string {
  const order: Lang[] = [preferred, "en", "ko", "ja", "zh"];
  for (const l of order) {
    const v = obj[l]?.trim();
    if (v) return v;
  }
  return "";
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const post = await getBoardPostById(id);
  const lang = await getServerLang();
  const title = post ? firstNonEmpty(post.title, lang) : null;
  const metaTitle = title ? `${title} | KSTAY` : "KSTAY";
  const description = post ? firstNonEmpty(post.excerpt, lang) : undefined;
  return {
    title: metaTitle,
    ...(description && { description }),
    openGraph: { title: metaTitle, ...(description && { description }) },
  };
}

export default async function BoardDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const post = await getBoardPostById(id);
  return <BoardDetailPageClient initialPost={post} />;
}
