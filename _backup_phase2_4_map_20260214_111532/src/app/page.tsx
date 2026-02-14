import Container from "@/components/layout/Container";
import CategoryPills from "@/features/search/components/CategoryPills";
import ListingCard from "@/features/listings/components/ListingCard";
import { listings } from "@/lib/mockData";
import { formatDateRange } from "@/lib/format";

function safeStr(v: unknown) {
  return typeof v === "string" ? v : "";
}

function safeInt(v: unknown, fallback = 0) {
  if (typeof v !== "string") return fallback;
  const n = Number.parseInt(v, 10);
  return Number.isFinite(n) ? n : fallback;
}

export default function Page({
  searchParams,
}: {
  searchParams?: { [key: string]: string | string[] | undefined };
}) {
  const category = safeStr(searchParams?.category) || "trending";
  const where = safeStr(searchParams?.where).trim();
  const start = safeStr(searchParams?.start);
  const end = safeStr(searchParams?.end);
  const guests = Math.min(16, Math.max(0, safeInt(searchParams?.guests, 0)));

  // Category filter
  const categoryFiltered =
    category === "trending" ? listings : listings.filter((l) => l.categories.includes(category));

  // Basic "where" filter (location/title contains)
  const whereLower = where.toLowerCase();
  const filtered = where
    ? categoryFiltered.filter((l) => {
        const hay = `${l.location} ${l.title}`.toLowerCase();
        return hay.includes(whereLower);
      })
    : categoryFiltered;

  const chips: string[] = [];
  if (where) chips.push(where);
  if (start && end) chips.push(formatDateRange(start, end));
  if (guests > 0) chips.push(`${guests} ${guests === 1 ? "guest" : "guests"}`);

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

            {chips.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {chips.map((c) => (
                  <span
                    key={c}
                    className="inline-flex items-center rounded-full border border-neutral-200 bg-white px-3 py-1.5 text-xs font-medium text-neutral-700"
                  >
                    {c}
                  </span>
                ))}
              </div>
            )}
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
          <span>{filtered.length} stays</span>
          <button className="rounded-full border border-neutral-200 px-4 py-2 hover:bg-neutral-50">
            Sort
          </button>
        </div>

        {filtered.length === 0 ? (
          <div className="rounded-2xl border border-neutral-200 p-10 text-center">
            <div className="text-lg font-semibold">No results</div>
            <p className="mt-2 text-sm text-neutral-600">
              Try a different destination or clear filters.
            </p>
          </div>
        ) : (
          <div className="grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
            {filtered.map((l) => (
              <ListingCard key={l.id} listing={l} />
            ))}
          </div>
        )}
      </Container>
    </>
  );
}
