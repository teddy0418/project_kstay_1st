import BrowseMapLayout from "@/features/browse/components/BrowseMapLayout";
import Container from "@/components/layout/Container";
import { getPublicListings } from "@/lib/repositories/listings";

type SP = { [key: string]: string | string[] | undefined };

function one(param: string | string[] | undefined): string {
  if (typeof param === "string") return param.trim();
  if (Array.isArray(param) && param[0]) return String(param[0]).trim();
  return "";
}

export default async function BrowsePage({
  searchParams,
}: {
  searchParams?: SP | Promise<SP>;
}) {
  const raw =
    searchParams && typeof (searchParams as Promise<SP>).then === "function"
      ? await (searchParams as Promise<SP>)
      : (searchParams ?? {});
  const sp = raw as SP;

  const where = one(sp.where);
  const start = one(sp.start);
  const end = one(sp.end);

  const filters =
    where || (start && end)
      ? { where: where || undefined, start: start || undefined, end: end || undefined }
      : undefined;

  const listings = await getPublicListings(filters);

  return (
    <Container className="py-6">
      <BrowseMapLayout items={listings} />
    </Container>
  );
}
