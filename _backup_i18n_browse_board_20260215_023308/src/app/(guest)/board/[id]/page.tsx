import Container from "@/components/layout/Container";
import { notFound } from "next/navigation";
import { boardPosts } from "@/lib/boardMock";

export default function BoardDetailPage({ params }: { params: { id: string } }) {
  const post = boardPosts.find((p) => p.id === params.id);
  if (!post) return notFound();

  return (
    <Container className="py-10">
      <div className="text-sm text-neutral-500">{post.location}</div>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight">{post.title}</h1>

      <div className="mt-6 aspect-[16/9] overflow-hidden rounded-2xl bg-neutral-100">
        <img
          src={post.imageUrl}
          alt={post.title}
          className="h-full w-full object-cover"
          loading="lazy"
        />
      </div>

      <div className="mt-6 rounded-2xl border border-neutral-200 p-5 text-sm text-neutral-700 leading-7">
        MVP placeholder content.
      </div>
    </Container>
  );
}
