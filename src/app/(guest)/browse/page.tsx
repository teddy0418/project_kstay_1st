import BrowseMapLayout from "@/features/browse/components/BrowseMapLayout";
import Container from "@/components/layout/Container";
import { getPublicListings } from "@/lib/repositories/listings";
import type { Listing } from "@/types";

type SP = { [key: string]: string | string[] | undefined };

function norm(v: unknown) {
  return String(v ?? "").trim().toLowerCase();
}

function filterByWhere(items: Listing[], where: string) {
  const q = norm(where);
  if (!q) return items;

  return items.filter((l) => {
    const city = norm(l.location.split("·")[0] ?? "");
    const location = norm(l.location);
    const title = norm(l.title);
    const address = norm(l.address);
    return city === q || location.includes(q) || title.includes(q) || address.includes(q);
  });
}

export default async function BrowsePage({
  searchParams,
}: {
  searchParams?: SP | Promise<SP>;
}) {
  const listings = await getPublicListings();
  const raw =
    searchParams && typeof (searchParams as Promise<SP>).then === "function"
      ? await (searchParams as Promise<SP>)
      : (searchParams ?? {});
  const sp = raw as SP;

  const whereRaw = sp.where;
  const where = typeof whereRaw === "string" ? whereRaw : Array.isArray(whereRaw) ? whereRaw[0] : "";

  const filtered = filterByWhere(listings, where);

  return (
    <Container className="py-6">
      <BrowseMapLayout items={filtered} />
    </Container>
  );
}
