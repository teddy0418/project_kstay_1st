"use client";

import Link from "next/link";
import Container from "@/components/layout/Container";
import { boardPosts } from "@/lib/boardMock";
import { useI18n } from "@/components/ui/LanguageProvider";

export default function BoardPage() {
  const { t } = useI18n();

  return (
    <Container className="py-10">
      <h1 className="text-2xl font-semibold tracking-tight">{t("board_headline")}</h1>
      <p className="mt-2 text-sm text-neutral-600">{t("board_subtitle")}</p>

      <div className="mt-8 grid gap-6 md:grid-cols-2">
        {boardPosts.map((p) => (
          <Link
            key={p.id}
            href={`/board/${p.id}`}
            className="rounded-2xl border border-neutral-200 bg-white overflow-hidden shadow-sm hover:shadow-md transition"
          >
            <div className="h-[180px] bg-neutral-100">
              <img src={p.coverImage} alt={p.title} className="h-full w-full object-cover" loading="lazy" />
            </div>
            <div className="p-5">
              <div className="text-xs font-semibold text-neutral-500">{p.city}</div>
              <div className="mt-1 text-lg font-semibold leading-snug">{p.title}</div>
              <div className="mt-2 text-sm text-neutral-600 leading-6">{p.excerpt}</div>
              <div className="mt-4 text-sm font-semibold text-neutral-900">{t("read_more")} →</div>
            </div>
          </Link>
        ))}
      </div>
    </Container>
  );
}
