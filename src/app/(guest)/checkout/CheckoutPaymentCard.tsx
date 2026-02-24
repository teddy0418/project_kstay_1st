"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { PaymentCurrency, PaymentPayMethod, requestPayment } from "@portone/browser-sdk/v2";
import { apiClient, ApiClientError } from "@/lib/api/client";
import { useAuth } from "@/components/ui/AuthProvider";
import { useCurrency } from "@/components/ui/CurrencyProvider";
import { useI18n } from "@/components/ui/LanguageProvider";

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

function mapToPortoneCurrency(code: string): PaymentCurrency {
  switch (code) {
    case "KRW":
      return PaymentCurrency.KRW;
    case "JPY":
      return PaymentCurrency.JPY;
    case "CNY":
      return PaymentCurrency.CNY;
    default:
      return PaymentCurrency.USD;
  }
}

function resolvePayMethod() {
  const raw = (process.env.NEXT_PUBLIC_PORTONE_PAY_METHOD || "").trim().toUpperCase();
  if (raw === "CARD") return PaymentPayMethod.CARD;
  if (raw === "EASY_PAY") return PaymentPayMethod.EASY_PAY;
  return PaymentPayMethod.EASY_PAY;
}

export default function CheckoutPaymentCard(props: Props) {
  const router = useRouter();
  const { user } = useAuth();
  const { currency } = useCurrency();
  const { lang } = useI18n();
  const c =
    lang === "ko"
      ? {
          payment: "결제",
          desc: "MVP에서는 모의 결제 흐름이며, 추후 PortOne 웹훅 검증으로 대체됩니다.",
          email: "게스트 이메일",
          name: "게스트 이름 (선택)",
          emailPh: "you@example.com",
          namePh: "게스트 이름",
          processing: "처리 중...",
          payNow: "지금 결제",
          disclaimer: "실제 결제 금액은 카드사 환율에 따라 소폭 차이가 있을 수 있습니다.",
          paymentNotCompleted: "결제가 완료되지 않았습니다.",
          requestFailed: "결제 요청에 실패했습니다.",
          guestFallback: "게스트",
        }
      : lang === "ja"
        ? {
            payment: "支払い",
            desc: "MVP ではモック決済で、後で PortOne webhook 検証に置き換え可能です。",
            email: "ゲストメール",
            name: "ゲスト名（任意）",
            emailPh: "you@example.com",
            namePh: "ゲスト名",
            processing: "処理中...",
            payNow: "今すぐ支払う",
            disclaimer: "実際の決済金額はカード会社の為替レートにより若干の差が出る場合があります。",
            paymentNotCompleted: "決済が完了しませんでした。",
            requestFailed: "決済リクエストに失敗しました。",
            guestFallback: "ゲスト",
          }
        : lang === "zh"
          ? {
              payment: "支付",
              desc: "MVP 阶段使用模拟支付，后续可替换为 PortOne webhook 校验。",
              email: "客人邮箱",
              name: "客人姓名（可选）",
              emailPh: "you@example.com",
              namePh: "客人姓名",
              processing: "处理中...",
              payNow: "立即支付",
              disclaimer: "实际支付金额可能因发卡行汇率略有差异。",
              paymentNotCompleted: "支付未完成。",
              requestFailed: "支付请求失败。",
              guestFallback: "Guest",
            }
          : {
              payment: "Payment",
              desc: "In MVP, payment confirmation is mocked and can be replaced by PortOne webhook later.",
              email: "Guest email",
              name: "Guest name (optional)",
              emailPh: "you@example.com",
              namePh: "Guest name",
              processing: "Processing...",
              payNow: "Pay now",
              disclaimer: "Actual charge may vary slightly due to card issuer exchange rates.",
              paymentNotCompleted: "Payment was not completed.",
              requestFailed: "Payment request failed.",
              guestFallback: "Guest",
            };

  const [guestName, setGuestName] = useState(user?.name ?? "");
  const [guestEmail, setGuestEmail] = useState(user?.email ?? "");
  const [paymentMethod, setPaymentMethod] = useState<"KAKAOPAY" | "PAYPAL" | "EXIMBAY">("KAKAOPAY");
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
        currency,
        paymentMethod,
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

        const payMethod = resolvePayMethod();
        const payCurrency = mapToPortoneCurrency(created.portone.currency);
        const result = await requestPayment({
          storeId: created.portone.storeId,
          channelKey: created.portone.channelKey,
          paymentId: created.portone.paymentId,
          orderName: created.portone.orderName,
          totalAmount: created.portone.totalAmount,
          currency: payCurrency,
          payMethod,
          customer: {
            fullName: guestName.trim() || user?.name || c.guestFallback,
            email: guestEmail,
          },
          redirectUrl: created.portone.redirectUrl,
          forceRedirect: created.portone.forceRedirect,
        });

        if (result?.code) {
          alert(result.message || c.paymentNotCompleted);
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
      } else if (err instanceof Error && err.message) {
        alert(err.message);
      } else {
        alert(c.requestFailed);
      }
      setPaying(false);
    }
  };

  return (
    <aside className="h-fit rounded-2xl border border-neutral-200 p-6 shadow-soft">
      <div className="text-sm font-semibold">{c.payment}</div>
      <p className="mt-2 text-sm text-neutral-600">
        {c.desc}
      </p>

      <div className="mt-4 grid gap-3">
        {(process.env.NEXT_PUBLIC_PAYMENT_PROVIDER || "MOCK").toUpperCase() === "PORTONE" && (
          <div className="rounded-xl border border-neutral-200 px-3 py-2">
            <label className="text-xs font-semibold text-neutral-500">
              {lang === "ko" ? "결제 수단" : lang === "ja" ? "支払い方法" : lang === "zh" ? "支付方式" : "Payment method"}
            </label>
            <div className="mt-2 flex flex-wrap gap-2">
              {(["KAKAOPAY", "PAYPAL", "EXIMBAY"] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setPaymentMethod(m)}
                  className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
                    paymentMethod === m
                      ? "bg-neutral-900 text-white"
                      : "bg-neutral-100 text-neutral-700 hover:bg-neutral-200"
                  }`}
                >
                  {m === "KAKAOPAY" ? "카카오페이" : m === "PAYPAL" ? "PayPal" : "Eximbay"}
                </button>
              ))}
            </div>
          </div>
        )}
        <div className="rounded-xl border border-neutral-200 px-3 py-2">
          <label className="text-xs font-semibold text-neutral-500">{c.email}</label>
          <input
            value={guestEmail}
            onChange={(e) => setGuestEmail(e.target.value)}
            readOnly={emailReadonly}
            className="mt-1 w-full text-sm outline-none read-only:text-neutral-500"
            placeholder={c.emailPh}
          />
        </div>
        <div className="rounded-xl border border-neutral-200 px-3 py-2">
          <label className="text-xs font-semibold text-neutral-500">{c.name}</label>
          <input
            value={guestName}
            onChange={(e) => setGuestName(e.target.value)}
            className="mt-1 w-full text-sm outline-none"
            placeholder={c.namePh}
          />
        </div>
      </div>

      <p className="mt-3 text-xs text-neutral-500">* {c.disclaimer}</p>

      <button
        type="button"
        onClick={onPayNow}
        disabled={!canPay || paying}
        className="mt-4 w-full rounded-xl bg-brand px-4 py-3 text-sm font-semibold text-brand-foreground hover:opacity-95 disabled:opacity-50"
      >
        {paying ? c.processing : c.payNow}
      </button>
    </aside>
  );
}
