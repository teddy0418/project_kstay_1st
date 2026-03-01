"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import Container from "@/components/layout/Container";
import { useI18n } from "@/components/ui/LanguageProvider";
import { apiClient } from "@/lib/api/client";

type Lang = "en" | "ko" | "ja" | "zh";
type BoardPost = {
  id: string;
  cover: string;
  title: Record<Lang, string>;
  excerpt: Record<Lang, string>;
  content: Record<Lang, string>;
};

export default function BoardPage() {
  const { lang, t } = useI18n();
  const [posts, setPosts] = useState<BoardPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient
      .get<BoardPost[]>("/api/board")
      .then((rows) => setPosts(Array.isArray(rows) ? rows : []))
      .catch(() => setPosts([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <Container className="py-10">
        <p className="text-neutral-500">{t("loading") ?? "불러오는 중..."}</p>
      </Container>
    );
  }

  return (
    <Container className="py-10">
      <h1 className="text-xl font-semibold tracking-tight md:text-2xl">{t("board_headline")}</h1>
      <p className="mt-2 text-xs text-neutral-600 md:text-sm">{t("board_subtitle")}</p>

      <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2">
        {posts.length === 0 ? (
          <p className="col-span-full text-center text-neutral-500 py-8">등록된 글이 없습니다.</p>
        ) : (
        posts.map((p) => (
          <Link
            key={p.id}
            href={`/board/${p.id}`}
            className="group block rounded-2xl border border-neutral-200 bg-white overflow-hidden shadow-sm hover:shadow-md transition min-w-0"
          >
            <div className="relative h-[180px] w-full overflow-hidden bg-neutral-100">
              <Image
                src={p.cover}
                alt={p.title[lang]}
                className="h-full w-full object-cover"
                width={1200}
                height={480}
                sizes="(max-width: 768px) 100vw, 50vw"
              />
            </div>
            <div className="p-5">
              <div className="mt-1 text-lg font-semibold leading-snug">{p.title[lang]}</div>
              <div className="mt-2 text-sm text-neutral-600 leading-6 line-clamp-2">{p.excerpt[lang]}</div>
              <div className="mt-4 text-sm font-semibold text-neutral-900">{t("read_more")} →</div>
            </div>
          </Link>
        )))}
      </div>
    </Container>
  );
}
