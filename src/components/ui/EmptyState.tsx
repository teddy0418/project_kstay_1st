"use client";

import Link from "next/link";

export default function EmptyState({
  title,
  description,
  primaryHref = "/",
  primaryLabel = "Go home",
  secondaryHref,
  secondaryLabel,
}: {
  title: string;
  description?: string;
  primaryHref?: string;
  primaryLabel?: string;
  secondaryHref?: string;
  secondaryLabel?: string;
}) {
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <div className="w-full max-w-screen-sm mx-auto rounded-3xl border border-neutral-200 bg-white shadow-sm p-6 md:p-8 text-center">
        <div className="text-2xl font-extrabold tracking-tight">{title}</div>
        {description ? <div className="mt-3 text-sm text-neutral-600 leading-6">{description}</div> : null}

        <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href={primaryHref}
            className="inline-flex items-center justify-center rounded-2xl bg-neutral-900 px-6 py-4 text-white text-sm font-semibold hover:opacity-95 transition"
          >
            {primaryLabel}
          </Link>

          {secondaryHref && secondaryLabel ? (
            <Link
              href={secondaryHref}
              className="inline-flex items-center justify-center rounded-2xl border border-neutral-200 bg-white px-6 py-4 text-sm font-semibold hover:bg-neutral-50 transition"
            >
              {secondaryLabel}
            </Link>
          ) : null}
        </div>
      </div>
    </div>
  );
}
