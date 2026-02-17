"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { PaymentCurrency, PaymentPayMethod, requestPayment } from "@portone/browser-sdk/v2";
import { apiClient, ApiClientError } from "@/lib/api/client";
import { useAuth } from "@/components/ui/AuthProvider";

type Props = {
  listingId: string;
  checkIn: string;
  checkOut: string;
  guests: number;
};

type CreateBookingResponse = {
  token: string;
  nextUrl: string;
  portone?: {
    storeId: string;
    channelKey: string;
    paymentId: string;
    orderName: string;
    totalAmount: number;
    currency: "USD" | "KRW";
    redirectUrl: string;
    forceRedirect: true;
  };
};

export default function CheckoutPaymentCard(props: Props) {
  const router = useRouter();
  const { user } = useAuth();

  const [guestName, setGuestName] = useState(user?.name ?? "");
  const [guestEmail, setGuestEmail] = useState(user?.email ?? "");
  const [paying, setPaying] = useState(false);
  const emailReadonly = Boolean(user?.email);

  const canPay = useMemo(() => {
    return props.listingId.length > 0 && props.checkIn.length > 0 && props.checkOut.length > 0 && guestEmail.includes("@");
  }, [props.listingId, props.checkIn, props.checkOut, guestEmail]);

  const onPayNow = async () => {
    if (!canPay || paying) return;
    setPaying(true);

    try {
      const created = await apiClient.post<CreateBookingResponse>("/api/bookings", {
        listingId: props.listingId,
        checkIn: props.checkIn,
        checkOut: props.checkOut,
        guestEmail,
        guestName: guestName.trim() || undefined,
        guestsAdults: Math.max(1, props.guests),
        guestsChildren: 0,
        guestsInfants: 0,
        guestsPets: 0,
      });

      const paymentProvider = (process.env.NEXT_PUBLIC_PAYMENT_PROVIDER || "MOCK").toUpperCase();

      if (paymentProvider === "MOCK") {
        await apiClient.post<{ token: string; status: string }>(`/api/bookings/public/${created.token}/confirm`);
        router.push(created.nextUrl);
        router.refresh();
        return;
      }

      if (paymentProvider === "PORTONE") {
        if (!created.portone) {
          throw new ApiClientError(500, "INTERNAL_ERROR", "PortOne payment request data is missing");
        }

        const result = await requestPayment({
          storeId: created.portone.storeId,
          channelKey: created.portone.channelKey,
          paymentId: created.portone.paymentId,
          orderName: created.portone.orderName,
          totalAmount: created.portone.totalAmount,
          currency: created.portone.currency === "KRW" ? PaymentCurrency.KRW : PaymentCurrency.USD,
          payMethod: PaymentPayMethod.CARD,
          customer: {
            fullName: guestName.trim() || user?.name || "Guest",
            email: guestEmail,
          },
          redirectUrl: created.portone.redirectUrl,
          forceRedirect: created.portone.forceRedirect,
        });

        if (result?.code) {
          alert(result.message || "Payment was not completed.");
          setPaying(false);
          return;
        }

        if (result?.paymentId) {
          router.push(`/checkout/success/${result.paymentId}`);
          router.refresh();
          return;
        }

        return;
      }

      router.push(created.nextUrl);
      router.refresh();
    } catch (err) {
      if (err instanceof ApiClientError) {
        alert(err.message);
      } else {
        alert("Payment request failed.");
      }
      setPaying(false);
    }
  };

  return (
    <aside className="h-fit rounded-2xl border border-neutral-200 p-6 shadow-soft">
      <div className="text-sm font-semibold">Payment</div>
      <p className="mt-2 text-sm text-neutral-600">
        In MVP, payment confirmation is mocked and can be replaced by PortOne webhook later.
      </p>

      <div className="mt-4 grid gap-3">
        <div className="rounded-xl border border-neutral-200 px-3 py-2">
          <label className="text-xs font-semibold text-neutral-500">Guest email</label>
          <input
            value={guestEmail}
            onChange={(e) => setGuestEmail(e.target.value)}
            readOnly={emailReadonly}
            className="mt-1 w-full text-sm outline-none read-only:text-neutral-500"
            placeholder="you@example.com"
          />
        </div>
        <div className="rounded-xl border border-neutral-200 px-3 py-2">
          <label className="text-xs font-semibold text-neutral-500">Guest name (optional)</label>
          <input
            value={guestName}
            onChange={(e) => setGuestName(e.target.value)}
            className="mt-1 w-full text-sm outline-none"
            placeholder="Guest name"
          />
        </div>
      </div>

      <button
        type="button"
        onClick={onPayNow}
        disabled={!canPay || paying}
        className="mt-4 w-full rounded-xl bg-brand px-4 py-3 text-sm font-semibold text-brand-foreground hover:opacity-95 disabled:opacity-50"
      >
        {paying ? "Processing..." : "Pay now"}
      </button>
    </aside>
  );
}
