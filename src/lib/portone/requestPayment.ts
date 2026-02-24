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

function resolvePayMethodAndOptions(paymentMethod: "KAKAOPAY" | "PAYPAL" | "EXIMBAY") {
  if (paymentMethod === "KAKAOPAY") {
    return { payMethod: PaymentPayMethod.EASY_PAY, easyPay: { easyPayProvider: EasyPayProvider.KAKAOPAY } };
  }
  if (paymentMethod === "PAYPAL") {
    return { payMethod: PaymentPayMethod.PAYPAL, paypal: {} };
  }
  return { payMethod: PaymentPayMethod.CARD };
}

export async function requestPortonePayment(params: PortonePayParams): Promise<void> {
  const { payMethod, ...methodOptions } = resolvePayMethodAndOptions(params.paymentMethod);
  const payCurrency = mapToPortoneCurrency(params.currency);

  await portoneRequestPayment({
    storeId: params.storeId,
    channelKey: params.channelKey,
    paymentId: params.paymentId,
    orderName: params.orderName,
    totalAmount: params.totalAmount,
    currency: payCurrency,
    payMethod,
    ...methodOptions,
    customer: {
      fullName: params.guestName || "Guest",
      email: params.guestEmail,
    },
    redirectUrl: params.redirectUrl,
    forceRedirect: params.forceRedirect,
  });
}
