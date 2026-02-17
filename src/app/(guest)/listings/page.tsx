import Container from "@/components/layout/Container";
import Link from "next/link";
import { getPublicListings } from "@/lib/repositories/listings";

export default async function ListingsIndexPage() {
  const listings = await getPublicListings();
  return (
    <Container className="py-10">
      <h1 className="text-2xl font-semibold tracking-tight">Listings (debug)</h1>
      <p className="mt-2 text-sm text-neutral-600">
        If detail navigation fails, click an ID below to verify routing.
      </p>

      <div className="mt-6 grid gap-2">
        {listings.map((l) => (
          <Link
            key={l.id}
            href={`/listings/${l.id}`}
            className="rounded-xl border border-neutral-200 px-4 py-3 text-sm font-semibold hover:bg-neutral-50 transition"
          >
            {l.id}
          </Link>
        ))}
      </div>
    </Container>
  );
}
