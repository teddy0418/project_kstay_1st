"use client";

import EmptyState from "@/components/ui/EmptyState";

export default function AdminError({
  error: _error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  void _error;

  return (
    <div className="min-h-[60vh]">
      <EmptyState
        title="Admin Error"
        description="Something went wrong in the admin panel. Please try again."
        primaryHref="/admin"
        primaryLabel="Back to Admin"
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
