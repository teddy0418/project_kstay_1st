import Container from "@/components/layout/Container";
import { listings } from "@/lib/mockData";
import ListingGallery from "@/features/listings/components/ListingGallery";
import DetailActions from "@/features/listings/components/DetailActions";
import MapModal from "@/features/listings/components/MapModal";
import BookingWidget from "@/features/listings/components/BookingWidget";
import Link from "next/link";
import { ChevronRight, MapPin, Star, Wifi, Dumbbell, Bath, Coffee, Sparkles, CheckCircle2, Key, MessageCircle, Tag } from "lucide-react";

function normalizeId(v: unknown) {
  if (v == null) return "";
  return String(v);
}

function formatDateEN(d: Date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(d);
}

function parseISO(s: string) {
  return new Date(`${s}T00:00:00`);
}

function addDays(d: Date, days: number) {
  const x = new Date(d);
  x.setDate(x.getDate() + days);
  return x;
}

function freeCancelUntilKST(checkInISO?: string) {
  if (!checkInISO) return null;
  const checkIn = parseISO(checkInISO);
  const deadline = addDays(checkIn, -7);
  return `${formatDateEN(deadline)} 23:59 (KST)`;
}

function ReviewsSection({ rating, count }: { rating: number; count: number }) {
  const dist = [
    { stars: 5, pct: 72 },
    { stars: 4, pct: 18 },
    { stars: 3, pct: 7 },
    { stars: 2, pct: 2 },
    { stars: 1, pct: 1 },
  ];

  const cats = [
    { label: "Cleanliness", icon: Sparkles, value: 4.9 },
    { label: "Accuracy", icon: CheckCircle2, value: 4.9 },
    { label: "Check-in", icon: Key, value: 4.8 },
    { label: "Communication", icon: MessageCircle, value: 4.9 },
    { label: "Location", icon: MapPin, value: 4.8 },
    { label: "Value", icon: Tag, value: 4.9 },
  ];

  const reviews = [
    {
      id: "r1",
      name: "Chaewon",
      meta: "Member for 5 years",
      date: "2 weeks ago",
      stars: 5,
      body:
        "Very clean and comfortable stay. Great view and the facilities were excellent. Would definitely book again next time I visit Korea.",
    },
    {
      id: "r2",
      name: "Jungwoo",
      meta: "Member for 7 years",
      date: "Dec 2025",
      stars: 5,
      body:
        "The location was perfect and the room looked exactly like the photos. Lots of convenient amenities nearby. Smooth check-in process!",
    },
    {
      id: "r3",
      name: "Hyejin",
      meta: "Member for 8 years",
      date: "Sep 2025",
      stars: 5,
      body:
        "Great value for money. The bed was comfy and the room was spotless. The host was responsive and helpful throughout the stay.",
    },
    {
      id: "r4",
      name: "Jiyoung",
      meta: "Member for 8 years",
      date: "Sep 2025",
      stars: 5,
      body:
        "Everything was as described and the overall experience was amazing. The neighborhood felt safe and the transportation options were easy.",
    },
  ];

  return (
    <section id="reviews" className="mt-12">
      <div className="flex items-center gap-2 text-lg font-semibold">
        <Star className="h-5 w-5" />
        <span>{rating.toFixed(2)}</span>
        <span className="text-neutral-400">·</span>
        <span>{count.toLocaleString()} reviews</span>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
        {/* distribution */}
        <div className="rounded-2xl border border-neutral-200 p-5">
          <div className="text-sm font-semibold">Overall rating</div>
          <div className="mt-4 grid gap-2">
            {dist.map((d) => (
              <div key={d.stars} className="flex items-center gap-3 text-sm">
                <div className="w-4 text-xs text-neutral-500">{d.stars}</div>
                <div className="flex-1 h-2 rounded-full bg-neutral-200 overflow-hidden">
                  <div className="h-full bg-neutral-900" style={{ width: `${d.pct}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* categories */}
        <div className="grid min-w-0 gap-4 sm:grid-cols-2 lg:grid-cols-[repeat(3,minmax(0,1fr))]">
          {cats.map((c) => {
            const Icon = c.icon;
            return (
              <div key={c.label} className="rounded-2xl border border-neutral-200 p-5">
                <div className="flex items-center gap-2 text-sm font-semibold text-neutral-700">
                  <Icon className="h-4 w-4" />
                  <span>{c.label}</span>
                </div>
                <div className="mt-2 text-xl font-semibold">{c.value.toFixed(1)}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* list */}
      <div className="mt-8 grid gap-6 md:grid-cols-2">
        {reviews.map((r) => (
          <div key={r.id} className="rounded-2xl border border-neutral-200 p-5">
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-full bg-neutral-900 text-white grid place-items-center text-sm font-semibold">
                {r.name.slice(0, 1)}
              </div>
              <div className="min-w-0">
                <div className="text-sm font-semibold">{r.name}</div>
                <div className="text-xs text-neutral-500">{r.meta}</div>

                <div className="mt-2 text-xs text-neutral-500">
                  {"★".repeat(r.stars)} <span className="mx-2">·</span> {r.date}
                </div>
                <p className="mt-2 text-sm text-neutral-700 leading-7">{r.body}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export default async function ListingDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { id: rawParam } = await params;
  const raw = rawParam ?? "";
  const id = decodeURIComponent(raw);

  const listing =
    listings.find((l: { id?: unknown; slug?: unknown }) => normalizeId(l.id) === id) ??
    listings.find((l: { id?: unknown; slug?: unknown }) => normalizeId(l.id) === raw) ??
    listings.find((l: { id?: unknown; slug?: unknown }) => normalizeId(l.slug) === id);

  if (!listing) {
    const available = listings.map((l: { id?: unknown }) => normalizeId(l.id)).filter(Boolean);

    return (
      <Container className="py-10">
        <h1 className="text-2xl font-semibold tracking-tight">Listing not found</h1>
        <div className="mt-6 rounded-2xl border border-neutral-200 p-5">
          <div className="text-sm font-semibold">Available listing IDs</div>
          <div className="mt-3 grid gap-2">
            {available.map((x) => (
              <Link
                key={x}
                href={`/listings/${encodeURIComponent(x)}`}
                className="rounded-xl border border-neutral-200 px-4 py-3 text-sm font-semibold hover:bg-neutral-50 transition"
              >
                {x}
              </Link>
            ))}
          </div>
        </div>
      </Container>
    );
  }

  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const start = typeof resolvedSearchParams?.start === "string" ? resolvedSearchParams.start : undefined;
  const end = typeof resolvedSearchParams?.end === "string" ? resolvedSearchParams.end : undefined;
  const guests = typeof resolvedSearchParams?.guests === "string" ? Number(resolvedSearchParams.guests) : undefined;

  const reviewCount = Number((listing as { reviewCount?: number }).reviewCount ?? 129);
  const cancelUntil = freeCancelUntilKST(start);

  const mapSrc =
    listing.lat && listing.lng
      ? `https://www.google.com/maps?q=${encodeURIComponent(String(listing.lat))},${encodeURIComponent(
          String(listing.lng)
        )}&z=14&output=embed`
      : null;

  return (
    <Container className="py-8">
      {/* Breadcrumbs */}
      <nav className="text-sm text-neutral-500 flex items-center gap-2">
        <Link href="/" className="hover:underline">
          Home
        </Link>
        <ChevronRight className="h-4 w-4" />
        <span>{listing.location}</span>
        <ChevronRight className="h-4 w-4" />
        <span className="truncate">{listing.title}</span>
      </nav>

      {/* Title + actions */}
      <div className="mt-4 flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold tracking-tight">{listing.title}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-neutral-600">
            <span className="inline-flex items-center gap-1 text-neutral-900">
              <Star className="h-4 w-4" />
              <span className="font-medium">{listing.rating.toFixed(2)}</span>
            </span>
            <span>·</span>
            <a href="#reviews" className="hover:underline">
              {reviewCount.toLocaleString()} reviews
            </a>
            <span>·</span>
            <span className="inline-flex items-center gap-1">
              <MapPin className="h-4 w-4" />
              {listing.location}
            </span>
          </div>
        </div>

        <DetailActions listingId={String(listing.id)} />
      </div>

      {/* Gallery */}
      <div className="mt-6">
        <ListingGallery title={listing.title} images={listing.images} />
      </div>

      {/* ✅ 사진 아래 3카드 (리뷰/부대시설/위치) */}
      <div className="mt-6 grid gap-4 md:grid-cols-3">
        {/* Reviews card */}
        <a
          href="#reviews"
          className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm hover:shadow-md transition"
        >
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-full bg-neutral-900 px-3 py-1 text-xs font-semibold text-white">
              <Star className="h-4 w-4" />
              {listing.rating.toFixed(2)}
            </span>
            <div className="text-sm font-semibold">{reviewCount.toLocaleString()} reviews</div>
          </div>
          <p className="mt-3 text-sm text-neutral-600 leading-6">
            Best value stay. Guests love the clean rooms and convenient location.
          </p>
          <div className="mt-4 text-sm font-semibold text-neutral-900">View reviews →</div>
        </a>

        {/* Amenities card */}
        <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
          <div className="text-sm font-semibold">Amenities</div>
          <div className="mt-3 grid grid-cols-2 gap-3 text-sm text-neutral-700">
            <div className="flex items-center gap-2"><Coffee className="h-4 w-4" /> Cafe/Bar</div>
            <div className="flex items-center gap-2"><Dumbbell className="h-4 w-4" /> Fitness</div>
            <div className="flex items-center gap-2"><Wifi className="h-4 w-4" /> Wi‑Fi</div>
            <div className="flex items-center gap-2"><Bath className="h-4 w-4" /> Bath</div>
            <div className="flex items-center gap-2"><Sparkles className="h-4 w-4" /> Clean kit</div>
            <div className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4" /> Essentials</div>
          </div>
        </div>

        {/* Location card */}
        <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div className="text-sm font-semibold">Location</div>
            <MapModal address={listing.address} lat={listing.lat} lng={listing.lng} />
          </div>
          <div className="mt-2 text-sm text-neutral-700">{listing.address}</div>

          <div className="mt-3 overflow-hidden rounded-xl border border-neutral-200 bg-neutral-100">
            {mapSrc ? (
              <iframe
                title="map-preview"
                src={mapSrc}
                className="h-[88px] w-full"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            ) : (
              <div className="h-[88px] grid place-items-center text-xs text-neutral-500">Map preview</div>
            )}
          </div>
        </div>
      </div>

      {/* ✅ 2컬럼: 좌 설명 / 우 예약 위젯(sticky) */}
      <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_380px]">
        {/* Left */}
        <section className="min-w-0">
          {/* Host card */}
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

          {/* Description */}
          <div className="mt-6 rounded-2xl border border-neutral-200 p-5">
            <h2 className="text-lg font-semibold">About this stay</h2>
            <p className="mt-3 text-sm text-neutral-700 leading-7 whitespace-pre-line">
              {listing.hostBio}
            </p>
            <div className="mt-4 text-xs text-neutral-500">
              Note: KSTAY shows all-in price early. No surprise fees at checkout.
            </div>
          </div>

          {/* Location big map */}
          <section className="mt-12">
            <h2 className="text-lg font-semibold">Location</h2>
            <div className="mt-3 flex items-center justify-between gap-3">
              <div className="text-sm text-neutral-700">{listing.address}</div>
              <MapModal address={listing.address} lat={listing.lat} lng={listing.lng} />
            </div>

            <div className="mt-4 overflow-hidden rounded-2xl border border-neutral-200 bg-neutral-100">
              {mapSrc ? (
                <iframe
                  title="map"
                  src={mapSrc}
                  className="h-[360px] w-full"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              ) : (
                <div className="h-[360px] grid place-items-center text-sm text-neutral-500">Map preview</div>
              )}
            </div>
          </section>

          {/* Reviews */}
          <ReviewsSection rating={listing.rating} count={reviewCount} />

          {/* Cancellation / Refund policy */}
          <section className="mt-12">
            <h2 className="text-lg font-semibold">Cancellation policy</h2>
            <div className="mt-4 rounded-2xl border border-neutral-200 p-5 text-sm text-neutral-700 leading-7">
              <ul className="list-disc pl-5 space-y-2">
                <li>
                  {cancelUntil ? (
                    <>
                      Free cancellation until <span className="font-semibold">{cancelUntil}</span>.
                    </>
                  ) : (
                    <>Free cancellation until 7 days before check-in (23:59 KST).</>
                  )}
                </li>
                <li>After the free cancellation deadline, cancellations are not refundable (MVP rule).</li>
                <li>
                  Instant pay model: your booking is confirmed immediately, but the host may decline within{" "}
                  <span className="font-semibold">24 hours</span>. If declined, payment will be voided/refunded automatically.
                </li>
                <li>All policy times are based on Korea Standard Time (KST).</li>
              </ul>
            </div>
          </section>
        </section>

        {/* Right */}
        <aside className="h-fit lg:sticky lg:top-28">
          <BookingWidget
            listingId={String(listing.id)}
            basePricePerNightKRW={listing.pricePerNightKRW}
            defaultStart={start}
            defaultEnd={end}
            defaultGuests={Number.isFinite(guests) ? guests : undefined}
          />
        </aside>
      </div>
    </Container>
  );
}
