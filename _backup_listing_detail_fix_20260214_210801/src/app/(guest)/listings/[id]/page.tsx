import Container from "@/components/layout/Container";
import { listings } from "@/lib/mockData";
import ListingGallery from "@/features/listings/components/ListingGallery";
import DetailActions from "@/features/listings/components/DetailActions";
import MapModal from "@/features/listings/components/MapModal";
import BookingWidget from "@/features/listings/components/BookingWidget";
import Link from "next/link";
import { Star } from "lucide-react";

export default function ListingDetailPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams?: { [key: string]: string | string[] | undefined };
}) {
  const listing = listings.find((l) => l.id === params.id);

  if (!listing) {
    return (
      <Container className="py-10">
        <h1 className="text-2xl font-semibold tracking-tight">Listing not found</h1>
        <p className="mt-2 text-sm text-neutral-600">
          ID: <span className="font-mono">{params.id}</span>
        </p>
        <div className="mt-6 rounded-2xl border border-neutral-200 p-5">
          <div className="text-sm font-semibold">Available IDs</div>
          <ul className="mt-3 grid gap-2 text-sm">
            {listings.map((l) => (
              <li key={l.id}>
                <Link className="text-brand underline" href={`/listings/${l.id}`}>
                  {l.id}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </Container>
    );
  }

  const start = typeof searchParams?.start === "string" ? searchParams?.start : undefined;
  const end = typeof searchParams?.end === "string" ? searchParams?.end : undefined;
  const guests =
    typeof searchParams?.guests === "string" ? Number(searchParams?.guests) : undefined;

  return (
    <Container className="py-8">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold tracking-tight">{listing.title}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-neutral-600">
            <span className="inline-flex items-center gap-1 text-neutral-900">
              <Star className="h-4 w-4" />
              <span className="font-medium">{listing.rating.toFixed(2)}</span>
            </span>
            <span>·</span>
            <span>{listing.location}</span>
          </div>
        </div>
        <DetailActions listingId={listing.id} />
      </div>

      <div className="mt-6 relative">
        <ListingGallery title={listing.title} images={listing.images} />
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <div className="text-sm text-neutral-600">
          <span className="font-semibold text-neutral-900">Best Value</span>{" "}
          <span className="text-neutral-500">(0% Host Fee)</span> <span className="mx-2">·</span>
          Tax & Service Fee Included
        </div>

        <div className="flex items-center gap-2">
          <MapModal address={listing.address} lat={listing.lat} lng={listing.lng} />
        </div>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_380px]">
        <section className="min-w-0">
          <div className="flex items-center gap-4 rounded-2xl border border-neutral-200 p-5">
            <div className="h-12 w-12 overflow-hidden rounded-full bg-neutral-100">
              <img
                src={listing.hostProfileImageUrl}
                alt={listing.hostName}
                className="h-full w-full object-cover"
                loading="lazy"
              />
            </div>
            <div className="min-w-0">
              <div className="text-sm font-semibold">Hosted by {listing.hostName}</div>
              <div className="mt-1 text-xs text-neutral-500">Verified 0% host fee partner</div>
            </div>
            <div className="ml-auto rounded-full bg-neutral-900 px-3 py-1 text-xs font-semibold text-white">
              0% Host Fee
            </div>
          </div>

          <div className="mt-6">
            <h2 className="text-lg font-semibold">About this place</h2>
            <p className="mt-3 text-sm text-neutral-700 leading-7">{listing.hostBio}</p>
          </div>
        </section>

        <BookingWidget
          listingId={listing.id}
          basePricePerNightKRW={listing.pricePerNightKRW}
          defaultStart={start}
          defaultEnd={end}
          defaultGuests={Number.isFinite(guests) ? guests : undefined}
        />
      </div>
    </Container>
  );
}
