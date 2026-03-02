import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { getCurrentHostFlow } from "@/lib/host/server";
import { getHostAnnouncementById } from "@/lib/repositories/host-announcements";

export const dynamic = "force-dynamic";

type PageProps = { params: Promise<{ id: string }> };

export default async function HostAnnouncementDetailPage(props: PageProps) {
  const current = await getCurrentHostFlow();
  if (!current) redirect("/login?next=/host/announcements");
  if (current.status === "NONE") redirect("/host/onboarding");

  const { id } = await props.params;
  const item = await getHostAnnouncementById(id);
  if (!item) notFound();

  const badgeClass =
    item.type === "공지"
      ? "bg-neutral-900 text-white"
      : item.type === "가이드"
        ? "bg-emerald-100 text-emerald-800"
        : "bg-neutral-100 text-neutral-700";

  return (
    <div className="grid gap-6">
      <div className="flex items-center gap-4">
        <Link href="/host/dashboard" className="text-sm font-medium text-neutral-600 hover:text-neutral-900">
          ← 대시보드
        </Link>
      </div>
      <article className="rounded-2xl border border-neutral-200 bg-white p-6 sm:p-8">
        <div className="flex flex-wrap items-center gap-2">
          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${badgeClass}`}>
            {item.type}
          </span>
        </div>
        <h1 className="mt-4 text-xl font-bold tracking-tight sm:text-2xl">{item.title}</h1>
        {item.body ? (
          <div className="mt-6 whitespace-pre-line text-sm leading-7 text-neutral-700 sm:text-base">
            {item.body}
          </div>
        ) : (
          <p className="mt-4 text-sm text-neutral-500">본문 없음</p>
        )}
      </article>
    </div>
  );
}
