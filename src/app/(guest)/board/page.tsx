"use client";

import Link from "next/link";
import Image from "next/image";
import Container from "@/components/layout/Container";
import { useI18n } from "@/components/ui/LanguageProvider";
import { getBoardPosts } from "@/lib/boardMock";

export default function BoardPage() {
  const { lang, t } = useI18n();
  const posts = getBoardPosts();

  return (
    <Container className="py-10">
      <h1 className="text-2xl font-semibold tracking-tight">{t("board_headline")}</h1>
      <p className="mt-2 text-sm text-neutral-600">{t("board_subtitle")}</p>

      <div className="mt-8 grid gap-6 md:grid-cols-2">
        {posts.map((p) => (
          <Link
            key={p.id}
            href={`/board/${p.id}`}
            className="rounded-2xl border border-neutral-200 bg-white overflow-hidden shadow-sm hover:shadow-md transition"
          >
            <div className="h-[180px] bg-neutral-100">
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
        ))}
      </div>
    </Container>
  );
}
