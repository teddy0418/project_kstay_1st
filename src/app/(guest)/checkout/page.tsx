import Container from "@/components/layout/Container";
import { redirect } from "next/navigation";
import { listings } from "@/lib/mockData";
import { diffNights, formatKRW } from "@/lib/format";
import { calcGuestServiceFeeKRW } from "@/lib/policy";
import CheckoutPaymentCard from "./CheckoutPaymentCard";

function safeStr(v: unknown) {
  return typeof v === "string" ? v : "";
}

function safeInt(v: unknown, fallback = 1) {
  if (typeof v !== "string") return fallback;
  const n = Number.parseInt(v, 10);
  return Number.isFinite(n) ? n : fallback;
}

export default function CheckoutPage({
  searchParams,
}: {
  searchParams?: { [key: string]: string | string[] | undefined };
}) {
  const listingId = safeStr(searchParams?.listingId);
  const start = safeStr(searchParams?.start);
  const end = safeStr(searchParams?.end);
  const guests = safeInt(searchParams?.guests, 1);

  const listing = listings.find((l) => l.id === listingId);
  if (!listing) redirect("/coming-soon");

  const nights = diffNights(start, end);
  const baseTotal = listing.pricePerNightKRW * Math.max(1, nights);
  const fee = calcGuestServiceFeeKRW(baseTotal);
  const total = baseTotal + fee;

  return (
    <Container className="py-10">
      <h1 className="text-2xl font-semibold tracking-tight">Checkout</h1>
      <p className="mt-2 text-sm text-neutral-600">
        Pay now and booking is finalized only after server-side payment verification.
      </p>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_380px]">
        <section className="rounded-2xl border border-neutral-200 p-6">
          <div className="text-sm font-semibold">{listing.title}</div>
          <div className="mt-2 text-sm text-neutral-600">
            Dates: {start && end ? `${start} → ${end}` : "Select dates"} · Guests: {guests}
          </div>

          <div className="mt-6 rounded-2xl border border-neutral-200 p-4 text-sm">
            <div className="flex justify-between">
              <span className="text-neutral-600">Base</span>
              <span>{formatKRW(baseTotal)}</span>
            </div>
            <div className="flex justify-between mt-1">
              <span className="text-neutral-600">Guest service fee (10%)</span>
              <span>{formatKRW(fee)}</span>
            </div>
            <div className="h-px bg-neutral-200 my-3" />
            <div className="flex justify-between font-semibold">
              <span>Total</span>
              <span>{formatKRW(total)}</span>
            </div>
            <div className="mt-1 text-xs text-neutral-500">Tax & Service Fee Included</div>
          </div>
        </section>

        <CheckoutPaymentCard listingId={listingId} checkIn={start} checkOut={end} guests={guests} />
      </div>
    </Container>
  );
}
