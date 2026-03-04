import {
  requestPayment as portoneRequestPayment,
  PaymentCurrency,
  PaymentPayMethod,
  EasyPayProvider,
} from "@portone/browser-sdk/v2";

export type PortonePayParams = {
  storeId: string;
  channelKey: string;
  paymentId: string;
  orderName: string;
  totalAmount: number;
  currency: "USD" | "KRW";
  redirectUrl: string;
  forceRedirect: true;
  paymentMethod: "KAKAOPAY" | "PAYPAL" | "EXIMBAY";
  guestName: string;
  guestEmail: string;
};

function mapToPortoneCurrency(code: string) {
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

/** Paymentwall 채널 전용 payMethod (SDK enum에 없음) */
const PAYMENTWALL_CREDIT_CARD = "PAYMENTWALL_CREDIT_CARD" as const;

function resolvePayMethodAndOptions(paymentMethod: "KAKAOPAY" | "PAYPAL" | "EXIMBAY") {
  if (paymentMethod === "KAKAOPAY") {
    return { payMethod: PaymentPayMethod.EASY_PAY, easyPay: { easyPayProvider: EasyPayProvider.KAKAOPAY } };
  }
  if (paymentMethod === "PAYPAL") {
    return { payMethod: PaymentPayMethod.PAYPAL, paypal: {} };
  }
  // EXIMBAY = Paymentwall 채널: 카드는 PAYMENTWALL_CREDIT_CARD 사용
  return { payMethod: PAYMENTWALL_CREDIT_CARD };
}

export async function requestPortonePayment(params: PortonePayParams): Promise<void> {
  const { payMethod, ...methodOptions } = resolvePayMethodAndOptions(params.paymentMethod);
  const payCurrency = mapToPortoneCurrency(params.currency);
  const isPaymentwall = params.paymentMethod === "EXIMBAY";

  const basePayload = {
    storeId: params.storeId,
    channelKey: params.channelKey,
    paymentId: params.paymentId,
    orderName: params.orderName,
    totalAmount: params.totalAmount,
    currency: payCurrency,
    payMethod,
    ...methodOptions,
    redirectUrl: params.redirectUrl,
  };

  // Paymentwall: buyer_name/buyer_email 필수(문서), forceRedirect 미지원 — customer만 포함
  // payMethod "PAYMENTWALL_CREDIT_CARD"는 SDK 타입에 없어 단언 사용
  if (isPaymentwall) {
    await portoneRequestPayment({
      ...basePayload,
      customer: {
        fullName: params.guestName || "Guest",
        email: params.guestEmail,
      },
    } as Parameters<typeof portoneRequestPayment>[0]);
    return;
  }

  await portoneRequestPayment({
    ...basePayload,
    customer: {
      fullName: params.guestName || "Guest",
      email: params.guestEmail,
    },
    forceRedirect: params.forceRedirect,
  } as Parameters<typeof portoneRequestPayment>[0]);
}
