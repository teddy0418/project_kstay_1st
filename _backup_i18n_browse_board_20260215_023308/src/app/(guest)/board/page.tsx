import Container from "@/components/layout/Container";
import Link from "next/link";
import { boardPosts } from "@/lib/boardMock";

export default function BoardPage() {
  return (
    <Container className="py-10">
      <h1 className="text-2xl font-semibold tracking-tight">Food & Travel Tips</h1>
      <p className="mt-2 text-sm text-neutral-600">Photo-first board (MVP)</p>

      <div className="mt-6 grid gap-4">
        {boardPosts.map((p) => (
          <Link
            key={p.id}
            href={`/board/${p.id}`}
            className="flex gap-4 rounded-2xl border border-neutral-200 p-3 hover:bg-neutral-50 transition"
          >
            <div className="h-24 w-32 shrink-0 overflow-hidden rounded-xl bg-neutral-100">
              <img
                src={p.imageUrl}
                alt={p.title}
                className="h-full w-full object-cover"
                loading="lazy"
              />
            </div>
            <div className="min-w-0">
              <div className="text-sm font-semibold text-neutral-900 line-clamp-2">{p.title}</div>
              <div className="mt-1 text-xs text-neutral-500">{p.location}</div>
              <div className="mt-2 flex flex-wrap gap-2">
                {p.tags.slice(0, 3).map((t) => (
                  <span
                    key={t}
                    className="rounded-full bg-neutral-100 px-2 py-1 text-[11px] text-neutral-700"
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </Container>
  );
}
