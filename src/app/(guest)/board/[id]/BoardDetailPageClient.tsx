"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useParams } from "next/navigation";
import Container from "@/components/layout/Container";
import { useI18n } from "@/components/ui/LanguageProvider";
import { apiClient } from "@/lib/api/client";

type Lang = "en" | "ko" | "ja" | "zh";
export type BoardPost = {
  id: string;
  cover: string;
  title: Record<Lang, string>;
  excerpt: Record<Lang, string>;
  content: Record<Lang, string>;
};

function firstNonEmpty(obj: Record<Lang, string>, preferred: Lang): string {
  const order: Lang[] = [preferred, "en", "ko", "ja", "zh"];
  for (const l of order) {
    const v = obj[l]?.trim();
    if (v) return v;
  }
  return "";
}

type Props = { initialPost?: BoardPost | null };

export default function BoardDetailPageClient({ initialPost }: Props) {
  const params = useParams();
  const idRaw = (params as { id?: string | string[] })?.id;
  const id = Array.isArray(idRaw) ? idRaw[0] : String(idRaw || "");

  const { lang, t } = useI18n();
  const [post, setPost] = useState<BoardPost | null>(initialPost ?? null);
  const [loading, setLoading] = useState(typeof initialPost === "undefined" && !!id);

  useEffect(() => {
    if (typeof initialPost !== "undefined") return;
    if (!id) return;
    apiClient
      .get<BoardPost>(`/api/board/${id}`)
      .then(setPost)
      .catch(() => setPost(null))
      .finally(() => setLoading(false));
  }, [id, initialPost]);

  if (loading) {
    return (
      <Container className="py-10">
        <p className="text-neutral-500">{t("loading")}</p>
      </Container>
    );
  }

  if (!post) {
    return (
      <Container className="py-10">
        <div className="text-lg font-semibold">{t("board_post_not_found")}</div>
        <Link href="/board" className="mt-4 inline-flex rounded-xl border border-neutral-200 px-4 py-2 text-sm font-semibold hover:bg-neutral-50">
          {t("back")}
        </Link>
      </Container>
    );
  }

  const titleText = firstNonEmpty(post.title, lang);
  const contentText = firstNonEmpty(post.content, lang);

  return (
    <Container className="py-10">
      <Link href="/board" className="text-sm font-semibold hover:underline">
        ← {t("back")}
      </Link>

      <div className="mt-6 overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm">
        <div className="h-[260px] bg-neutral-100">
          <Image
            src={post.cover}
            alt={titleText}
            className="h-full w-full object-cover"
            width={1200}
            height={520}
            sizes="100vw"
          />
        </div>
        <div className="p-6">
          <div className="text-2xl font-extrabold tracking-tight">{titleText}</div>
          <div className="mt-2 text-sm text-neutral-600 leading-7 whitespace-pre-line">
            {contentText}
          </div>
        </div>
      </div>
    </Container>
  );
}
