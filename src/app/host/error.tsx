"use client";

import EmptyState from "@/components/ui/EmptyState";

export default function HostError({
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
        title="오류가 발생했습니다"
        description="호스트 페이지에서 오류가 발생했습니다. 다시 시도해 주세요."
        primaryHref="/host"
        primaryLabel="호스트 홈으로"
      />
      <div className="mx-auto w-full max-w-screen-sm px-4 pb-10 -mt-10">
        <button
          type="button"
          onClick={() => reset()}
          className="w-full rounded-2xl border border-neutral-200 bg-white px-6 py-4 text-sm font-semibold hover:bg-neutral-50 transition"
        >
          다시 시도
        </button>
      </div>
    </div>
  );
}
