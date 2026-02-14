import Image from "next/image";
import { notFound } from "next/navigation";
import { Star } from "lucide-react";
import Container from "@/components/layout/Container";
import { listings } from "@/lib/mockData";
import { formatDateRange, formatKRW } from "@/lib/format";

export default function ListingDetailPage({ params }: { params: { id: string } }) {
  const listing = listings.find((l) => l.id === params.id);
  if (!listing) return notFound();

  return (
    <Container className="py-8">
      <div className="mb-4">
        <h1 className="text-2xl font-semibold">{listing.title}</h1>
        <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-neutral-600">
          <span className="inline-flex items-center gap-1 text-neutral-900">
            <Star className="h-4 w-4" />
            <span className="font-medium">{listing.rating.toFixed(2)}</span>
          </span>
          <span>·</span>
          <span>{listing.location}</span>
          <span>·</span>
          <span>{formatDateRange(listing.startDate, listing.endDate)}</span>
        </div>
      </div>

      <div className="relative aspect-[16/10] w-full overflow-hidden rounded-2xl bg-neutral-100">
        <Image
          src={listing.imageUrl}
          alt={listing.title}
          fill
          className="object-cover"
          sizes="(min-width: 1024px) 900px, 100vw"
          priority
        />
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_380px]">
        <section>
          <h2 className="text-lg font-semibold">About this place</h2>
          <p className="mt-3 leading-7 text-neutral-700">
            This is a clean starting point for KSTAY listing pages. Next we will add:
            amenities, house rules, check-in guide, reviews, and a map — all written for international guests.
          </p>

          <div className="mt-6 grid gap-3 rounded-2xl border border-neutral-200 p-5">
            <div className="text-sm text-neutral-700">
              ✅ Guest-friendly: clear English house rules + easy check-in instructions
            </div>
            <div className="text-sm text-neutral-700">
              ✅ Local hosting: Korean hosts, globally understandable experience
            </div>
            <div className="text-sm text-neutral-700">
              ✅ Trust-first: verified photos & transparent policies (coming next)
            </div>
          </div>
        </section>

        <aside className="h-fit rounded-2xl border border-neutral-200 p-6 shadow-soft">
          <div className="flex items-end justify-between">
            <div className="text-xl font-semibold">
              {formatKRW(listing.pricePerNightKRW)}
              <span className="text-sm font-normal text-neutral-600"> / night</span>
            </div>
            <div className="text-sm text-neutral-600">KRW</div>
          </div>

          <div className="mt-4 grid gap-2 rounded-xl border border-neutral-200 p-3 text-sm">
            <div className="flex justify-between">
              <span className="text-neutral-600">Dates</span>
              <span className="text-neutral-900">{formatDateRange(listing.startDate, listing.endDate)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-600">Guests</span>
              <span className="text-neutral-900">1–2 (placeholder)</span>
            </div>
          </div>

          <button className="mt-4 w-full rounded-xl bg-brand px-4 py-3 text-sm font-semibold text-brand-foreground hover:opacity-95">
            Check availability
          </button>
          <p className="mt-3 text-xs text-neutral-500">
            Booking & payments will be connected in later phases.
          </p>
        </aside>
      </div>
    </Container>
  );
}
