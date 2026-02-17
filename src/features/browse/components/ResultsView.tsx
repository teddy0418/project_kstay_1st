import type { Listing } from "@/types";
import ListingCard from "@/features/listings/components/ListingCard";

export default function ResultsView({ items }: { items: Listing[] }) {
  return (
    <div className="grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {items.map((l) => (
        <ListingCard key={l.id} listing={l} />
      ))}
    </div>
  );
}
