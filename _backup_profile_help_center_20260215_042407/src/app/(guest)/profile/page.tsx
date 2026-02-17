"use client";

import { useState } from "react";
import Container from "@/components/layout/Container";
import {
  isCancellationAllowedNow,
  freeCancellationDeadlineUtcMs,
  formatKSTDateTimeFromUtcMs,
} from "@/lib/policy";

const mockBookings = [
  { id: "b1", listingTitle: "Cozy studio near Seoul Forest", checkInDate: "2026-03-10" },
  {
    id: "b2",
    listingTitle: "Ocean view apartment — sunrise from bed",
    checkInDate: "2026-02-20",
  },
];

export default function ProfilePage() {
  const [now] = useState(() => Date.now());

  return (
    <Container className="py-10">
      <h1 className="text-2xl font-semibold tracking-tight">Profile</h1>
      <p className="mt-2 text-sm text-neutral-600">
        MVP: My trips + cancellation button logic (Korea Time).
      </p>

      <div className="mt-6 grid gap-4">
        {mockBookings.map((b) => {
          const allowed = isCancellationAllowedNow(b.checkInDate, now);
          const deadline = formatKSTDateTimeFromUtcMs(freeCancellationDeadlineUtcMs(b.checkInDate));

          return (
            <div key={b.id} className="rounded-2xl border border-neutral-200 p-5">
              <div className="text-sm font-semibold">{b.listingTitle}</div>
              <div className="mt-1 text-sm text-neutral-600">Check-in: {b.checkInDate}</div>
              <div className="mt-2 text-xs text-neutral-500">
                Free cancellation until <span className="font-semibold">{deadline}</span>
              </div>

              {allowed ? (
                <button className="mt-4 rounded-xl border border-neutral-200 px-4 py-2 text-sm font-semibold hover:bg-neutral-50">
                  Cancel reservation
                </button>
              ) : (
                <div className="mt-4 text-sm text-neutral-600">
                  Cancellation unavailable. Please contact support.
                </div>
              )}
            </div>
          );
        })}
      </div>
    </Container>
  );
}
