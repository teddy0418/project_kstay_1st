"use client";

import EmptyState from "@/components/ui/EmptyState";

export default function GlobalError({
  error: _error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  void _error;

  return (
    <div className="bg-[#F9FAFB] min-h-screen">
      <EmptyState
        title="Something went wrong"
        description="An unexpected error occurred. Please try again."
        primaryHref="/"
        primaryLabel="Back to Home"
      />

      <div className="mx-auto w-full max-w-screen-sm px-4 pb-10 -mt-10">
        <button
          type="button"
          onClick={() => reset()}
          className="w-full rounded-2xl border border-neutral-200 bg-white px-6 py-4 text-sm font-semibold hover:bg-neutral-50 transition"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
