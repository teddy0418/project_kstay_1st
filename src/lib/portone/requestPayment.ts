import {
  requestPayment as portoneRequestPayment,
  PaymentCurrency,
  PaymentPayMethod,
} from "@portone/browser-sdk/v2";
import type { PaymentResponse } from "@portone/browser-sdk/v2";

export type PortonePayParams = {
  storeId: string;
  channelKey: string;
  paymentId: string;
  orderName: string;
  totalAmount: number;
  currency: string;
  redirectUrl: string;
  guestName: string;
  guestEmail: string;
};

export type PortonePayResult = {
  success: boolean;
  paymentId: string;
  code?: string;
  message?: string;
};

/** PortOne SDK 지원 통화만 매핑, 나머지는 USD */
function mapToPortoneCurrency(code: string) {
  switch (code) {
    case "KRW":
      return PaymentCurrency.KRW;
    case "JPY":
      return PaymentCurrency.JPY;
    default:
      return PaymentCurrency.USD;
  }
}

/**
 * PortOne 결제 요청. 엑심베이(Eximbay) 채널 카드 결제.
 *
 * windowType 미지정 → PG(엑심베이) 기본 방식 사용.
 * - PC: 팝업 (브라우저에서 팝업 허용 필요)
 * - Mobile: 리다이렉트
 */
export async function requestPortonePayment(params: PortonePayParams): Promise<PortonePayResult> {
  const resp: PaymentResponse | undefined = await portoneRequestPayment({
    storeId: params.storeId,
    channelKey: params.channelKey,
    paymentId: params.paymentId,
    orderName: params.orderName,
    totalAmount: params.totalAmount,
    currency: mapToPortoneCurrency(params.currency),
    payMethod: PaymentPayMethod.CARD,
    redirectUrl: params.redirectUrl,
    customer: {
      fullName: params.guestName || "Guest",
      email: params.guestEmail,
    },
  });

  if (!resp) {
    return { success: false, paymentId: params.paymentId, code: "NO_RESPONSE", message: "No response from payment gateway" };
  }
  if (resp.code) {
    return { success: false, paymentId: resp.paymentId, code: resp.code, message: resp.message };
  }
  return { success: true, paymentId: resp.paymentId };
}
