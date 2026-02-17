import Container from "@/components/layout/Container";
import PopularDestinations from "@/features/home/components/PopularDestinations";
import ListingCard from "@/features/listings/components/ListingCard";
import { getPublicListings } from "@/lib/repositories/listings";

export default async function Page() {
  const listings = await getPublicListings();
  console.log("[KSTAY:server] 3. Home page render", { listingsCount: listings.length });
  return (
    <>
      <PopularDestinations />

      <Container className="py-10">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold tracking-tight">Top Recommended Stays</h2>
            <p className="mt-1 text-sm text-neutral-600">
              KSTAY offers the most competitive rates by minimizing intermediary fees compared to other platforms.
            </p>
          </div>
        </div>

        <div className="mt-6 grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {listings.slice(0, 8).map((l) => (
            <ListingCard key={l.id} listing={l} />
          ))}
        </div>
      </Container>
    </>
  );
}
