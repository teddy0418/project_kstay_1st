import Container from "@/components/layout/Container";
import CategoryPills from "@/features/search/components/CategoryPills";
import ListingCard from "@/features/listings/components/ListingCard";
import { listings } from "@/lib/mockData";

export default function Page({
  searchParams,
}: {
  searchParams?: { category?: string };
}) {
  const category = searchParams?.category ?? "trending";

  const filtered =
    category === "trending"
      ? listings
      : listings.filter((l) => l.categories.includes(category));

  const resultsLabel =
    category === "trending" ? "Popular stays" : `${filtered.length} stays`;

  return (
    <>
      <CategoryPills />

      <Container className="py-8">
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Stays in Korea</h1>
            <p className="mt-1 text-sm text-neutral-600">
              English-first experience for international travelers — hosted by locals in Korea.
            </p>
          </div>

          <div className="hidden md:flex gap-2">
            <button className="rounded-full border border-neutral-200 px-4 py-2 text-sm hover:bg-neutral-50">
              Filters
            </button>
            <button className="rounded-full border border-neutral-200 px-4 py-2 text-sm hover:bg-neutral-50">
              Show map
            </button>
          </div>
        </div>

        <div className="mb-4 flex items-center justify-between text-sm text-neutral-600">
          <span>{resultsLabel}</span>
          <div className="flex gap-2">
            <button className="rounded-full border border-neutral-200 px-4 py-2 hover:bg-neutral-50">
              Sort
            </button>
          </div>
        </div>

        <div className="grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
          {filtered.map((l) => (
            <ListingCard key={l.id} listing={l} />
          ))}
        </div>
      </Container>
    </>
  );
}
