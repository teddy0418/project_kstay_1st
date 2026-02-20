"use client";

import Link from "next/link";
import Image from "next/image";
import { useParams } from "next/navigation";
import Container from "@/components/layout/Container";
import { useI18n } from "@/components/ui/LanguageProvider";
import { getBoardPost } from "@/lib/boardMock";

export default function BoardDetailPage() {
  const params = useParams();
  const idRaw = (params as { id?: string | string[] })?.id;
  const id = Array.isArray(idRaw) ? idRaw[0] : String(idRaw || "");

  const { lang, t } = useI18n();
  const post = getBoardPost(id);

  if (!post) {
    return (
      <Container className="py-10">
        <div className="text-lg font-semibold">Post not found</div>
        <Link href="/board" className="mt-4 inline-flex rounded-xl border border-neutral-200 px-4 py-2 text-sm font-semibold hover:bg-neutral-50">
          {t("back")}
        </Link>
      </Container>
    );
  }

  return (
    <Container className="py-10">
      <Link href="/board" className="text-sm font-semibold hover:underline">
        ← {t("back")}
      </Link>

      <div className="mt-6 overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm">
        <div className="h-[260px] bg-neutral-100">
          <Image
            src={post.cover}
            alt={post.title[lang]}
            className="h-full w-full object-cover"
            width={1200}
            height={520}
            sizes="100vw"
          />
        </div>
        <div className="p-6">
          <div className="text-2xl font-extrabold tracking-tight">{post.title[lang]}</div>
          <div className="mt-2 text-sm text-neutral-600 leading-7 whitespace-pre-line">
            {post.content[lang]}
          </div>
        </div>
      </div>
    </Container>
  );
}
