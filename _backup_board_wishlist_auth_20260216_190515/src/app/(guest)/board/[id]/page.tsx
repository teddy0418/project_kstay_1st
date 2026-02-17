"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useParams } from "next/navigation";
import { useI18n } from "@/components/ui/LanguageProvider";
import Container from "@/components/layout/Container";
import { getBoardPost } from "@/lib/boardMock";

export default function BoardDetailPage() {
  const { t } = useI18n();
  const params = useParams<{ id: string }>();

  const idRaw = params?.id;
  const id = typeof idRaw === "string" ? idRaw : Array.isArray(idRaw) ? idRaw[0] : "";

  const post = useMemo(() => (id ? getBoardPost(id) : undefined), [id]);

  if (!post) {
    return (
      <Container className="py-10">
        <div className="text-lg font-semibold">Post not found</div>
        <Link href="/board" className="mt-4 inline-block text-sm font-semibold underline">
          {t("back")}
        </Link>
      </Container>
    );
  }

  return (
    <Container className="py-10">
      <Link href="/board" className="text-sm font-semibold underline">
        ← {t("back")}
      </Link>

      <div className="mt-6">
        <div className="text-xs font-semibold text-neutral-500">{post.city}</div>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">{post.title}</h1>
        <div className="mt-2 text-sm text-neutral-500">{post.createdAt}</div>
      </div>

      <div className="mt-6 overflow-hidden rounded-2xl border border-neutral-200 bg-neutral-100">
        <img src={post.coverImage} alt={post.title} className="h-[340px] w-full object-cover" loading="lazy" />
      </div>

      <article className="prose prose-neutral max-w-none mt-8">
        {post.content.split("\n").map((line: string, i: number) => (
          <p key={i}>{line}</p>
        ))}
      </article>
    </Container>
  );
}
