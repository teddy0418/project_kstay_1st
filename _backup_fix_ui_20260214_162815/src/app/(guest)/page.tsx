import Container from "@/components/layout/Container";
import PopularDestinations from "@/features/home/components/PopularDestinations";
import ListingCard from "@/features/listings/components/ListingCard";
import { listings } from "@/lib/mockData";
import Link from "next/link";

export default function Page() {
  return (
    <>
      <PopularDestinations />

      <Container className="py-10">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold tracking-tight">Top Recommended Stays</h2>
            <p className="mt-1 text-sm text-neutral-600">
              Transparent all-in pricing (Tax & Service Fee Included) — best value via 0% host fee.
            </p>
          </div>
          <Link
            href="/browse"
            className="hidden sm:inline-flex rounded-full border border-neutral-200 px-4 py-2 text-sm font-semibold hover:bg-neutral-50"
          >
            Browse all
          </Link>
        </div>

        <div className="mt-6 grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {listings.slice(0, 8).map((l) => (
            <ListingCard key={l.id} listing={l} />
          ))}
        </div>

        <div className="mt-10 sm:hidden">
          <Link
            href="/browse"
            className="inline-flex w-full items-center justify-center rounded-xl bg-brand px-5 py-3 text-sm font-semibold text-brand-foreground hover:opacity-95"
          >
            Browse all stays
          </Link>
        </div>
      </Container>
    </>
  );
}
