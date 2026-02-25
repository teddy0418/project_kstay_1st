"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { ListingWizardProvider, useListingWizard } from "@/features/host/listings/ListingWizardContext";
import ListingWizardShell from "@/features/host/listings/ListingWizardShell";

const LOADING_TIMEOUT_MS = 15000;

function WizardLayoutInner({ children }: { children: React.ReactNode }) {
  const { listing, loading, error, isLocked, reload } = useListingWizard();
  const params = useParams();
  const id = params?.id as string | undefined;
  const [loadingTimedOut, setLoadingTimedOut] = useState(false);

  useEffect(() => {
    if (!loading) {
      queueMicrotask(() => setLoadingTimedOut(false));
      return;
    }
    const t = setTimeout(() => setLoadingTimedOut(true), LOADING_TIMEOUT_MS);
    return () => clearTimeout(t);
  }, [loading]);

  if (!id) return null;
  if (loading) {
    return (
      <div className="mx-auto max-w-2xl p-8 text-center text-neutral-600">
        <p>불러오는 중…</p>
        {loadingTimedOut && (
          <p className="mt-4 text-sm">
            시간이 걸리고 있습니다.{" "}
            <button type="button" onClick={() => void reload()} className="text-neutral-900 underline">
              다시 시도
            </button>
          </p>
        )}
      </div>
    );
  }
  if (error || !listing) {
    return (
      <div className="mx-auto max-w-2xl p-8">
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-800">
          {error ?? "숙소를 불러올 수 없습니다."}
        </div>
      </div>
    );
  }

  return (
    <ListingWizardShell listingId={id} isLocked={isLocked}>
      {children}
    </ListingWizardShell>
  );
}

export default function HostListingsNewIdLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const params = useParams();
  const id = params?.id as string | undefined;

  if (!id) return <>{children}</>;

  return (
    <ListingWizardProvider listingId={id}>
      <WizardLayoutInner>{children}</WizardLayoutInner>
    </ListingWizardProvider>
  );
}
