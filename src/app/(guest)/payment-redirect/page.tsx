"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

export default function PaymentRedirectPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const paymentId = searchParams.get("paymentId") || "";
  const code = searchParams.get("code") || "";
  const message = searchParams.get("message") || "";

  useEffect(() => {
    if (!paymentId) return;
    const qs = searchParams.toString();
    const target = `/checkout/success/${encodeURIComponent(paymentId)}${qs ? `?${qs}` : ""}`;
    router.replace(target);
  }, [paymentId, router, searchParams]);

  if (!paymentId) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-12">
        <h1 className="text-2xl font-semibold tracking-tight">Payment redirect failed</h1>
        <p className="mt-2 text-sm text-neutral-600">
          {code ? `Code: ${code}` : "paymentId is missing from redirect query."}
        </p>
        {message ? <p className="mt-1 text-sm text-neutral-600">{message}</p> : null}
        <Link href="/" className="mt-6 inline-flex rounded-xl bg-neutral-900 px-5 py-3 text-sm font-semibold text-white">
          Back to Home
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-2xl font-semibold tracking-tight">Processing your payment...</h1>
      <p className="mt-2 text-sm text-neutral-600">
        Redirect completed. We are checking payment status on the server.
      </p>
    </main>
  );
}
