import Container from "@/components/layout/Container";
import ResultsView from "@/features/browse/components/ResultsView";
import { listings } from "@/lib/mockData";

function safeStr(v: unknown) {
  return typeof v === "string" ? v : "";
}

export default function BrowsePage({
  searchParams,
}: {
  searchParams?: { [key: string]: string | string[] | undefined };
}) {
  const where = safeStr(searchParams?.where).trim();

  const whereLower = where.toLowerCase();
  const filtered = where
    ? listings.filter((l) =>
        `${l.location} ${l.title}`.toLowerCase().includes(whereLower)
      )
    : listings;

  return (
    <Container className="py-8">
      <div className="mb-5">
        <h1 className="text-2xl font-semibold tracking-tight">Explore stays</h1>
        <p className="mt-1 text-sm text-neutral-600">
          Best Value stays with transparent all-in pricing.
        </p>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-neutral-200 p-10 text-center">
          <div className="text-lg font-semibold">No results</div>
          <p className="mt-2 text-sm text-neutral-600">
            Try a different destination.
          </p>
        </div>
      ) : (
        <ResultsView items={filtered} />
      )}
    </Container>
  );
}
