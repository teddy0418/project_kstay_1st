import { redirect } from "next/navigation";

type SP = { next?: string | string[] };

export default async function AuthLoginRedirect({
  searchParams,
}: {
  searchParams?: SP | Promise<SP>;
}) {
  const resolved: SP =
    searchParams && typeof (searchParams as Promise<SP>).then === "function"
      ? await (searchParams as Promise<SP>)
      : ((searchParams ?? {}) as SP);

  const nextRaw = resolved.next;
  const next = typeof nextRaw === "string" && nextRaw.startsWith("/") ? nextRaw : "/";
  const qs = next === "/" ? "" : `?next=${encodeURIComponent(next)}`;

  redirect(`/login${qs}`);
}
