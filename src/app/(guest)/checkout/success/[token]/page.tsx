"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { apiClient } from "@/lib/api/client";

type PublicBooking = {
  token: string;
  status: "PENDING_PAYMENT" | "CONFIRMED" | "CANCELLED";
  listing: { id: string; title: string; city: string; area: string; address: string };
  checkInText: string;
  checkOutText: string;
  nights: number;
  guests: { adults: number; children: number; infants: number; pets: number };
  totals: { usdText: string; krw: number };
  cancellationDeadlineKst: string;
};

export default function CheckoutSuccessPage() {
  const params = useParams<{ token: string }>();
  const searchParams = useSearchParams();
  const token = String(params?.token ?? "");
  const redirectCode = searchParams.get("code") || "";
  const redirectMessage = searchParams.get("message") || "";
  const [booking, setBooking] = useState<PublicBooking | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    let active = true;
    let attempts = 0;

    const fetchBooking = async () => {
      try {
        const data = await apiClient.get<PublicBooking>(`/api/bookings/public/${token}`);
        if (!active) return;
        setBooking(data);
        if (data.status === "PENDING_PAYMENT" && attempts < 10) {
          attempts += 1;
          setTimeout(fetchBooking, 2500);
          return;
        }
      } catch {
        // keep fallback view
      } finally {
        if (active) setLoading(false);
      }
    };

    void fetchBooking();
    return () => {
      active = false;
    };
  }, [token]);

  const guestsText = useMemo(() => {
    if (!booking) return "";
    return `${booking.guests.adults} adults, ${booking.guests.children} children, ${booking.guests.infants} infants, ${booking.guests.pets} pets`;
  }, [booking]);

  if (loading) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-12">
        <h1 className="text-2xl font-semibold tracking-tight">Processing your booking...</h1>
        <p className="mt-2 text-sm text-neutral-600">Please wait while we confirm your payment.</p>
      </main>
    );
  }

  if (!booking) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-12">
        <h1 className="text-2xl font-semibold tracking-tight">Booking not found</h1>
        <p className="mt-2 text-sm text-neutral-600">Please check your booking link again.</p>
        <Link href="/" className="mt-6 inline-flex rounded-xl bg-neutral-900 px-5 py-3 text-sm font-semibold text-white">
          Back to Home
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-12">
      {redirectCode ? (
        <section className="mb-4 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Payment redirect reported: {redirectCode}
          {redirectMessage ? ` - ${redirectMessage}` : ""}
        </section>
      ) : null}
      <h1 className="text-2xl font-semibold tracking-tight">
        {booking.status === "CONFIRMED" ? "Booking confirmed" : "Processing..."}
      </h1>
      <p className="mt-2 text-sm text-neutral-600">
        {booking.status === "CONFIRMED"
          ? "Your booking is confirmed. A confirmation email has been sent."
          : "We are still processing your payment. This page refreshes automatically."}
      </p>

      <section className="mt-6 rounded-2xl border border-neutral-200 bg-white p-6">
        <div className="text-lg font-semibold">{booking.listing.title}</div>
        <div className="mt-1 text-sm text-neutral-600">
          {booking.listing.city} · {booking.listing.area}
        </div>
        <div className="mt-1 text-sm text-neutral-600">{booking.listing.address}</div>
        <div className="mt-4 grid gap-1 text-sm">
          <div><strong>Booking token:</strong> {booking.token}</div>
          <div><strong>Dates:</strong> {booking.checkInText} - {booking.checkOutText} ({booking.nights} nights)</div>
          <div><strong>Guests:</strong> {guestsText}</div>
          <div><strong>Total:</strong> {booking.totals.usdText} / ₩{booking.totals.krw.toLocaleString()}</div>
          <div><strong>Free cancellation until:</strong> {booking.cancellationDeadlineKst}</div>
        </div>
      </section>

      <div className="mt-6 flex gap-3">
        <Link href="/profile" className="rounded-xl bg-neutral-900 px-5 py-3 text-sm font-semibold text-white">
          Go to Profile
        </Link>
        <Link href="/" className="rounded-xl border border-neutral-200 px-5 py-3 text-sm font-semibold">
          Back to Home
        </Link>
      </div>
    </main>
  );
}
