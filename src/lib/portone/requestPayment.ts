import {
  requestPayment as portoneRequestPayment,
  PaymentCurrency,
} from "@portone/browser-sdk/v2";

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
  /** 엑심베이 채널에서는 미지원, 무시됨 */
  forceRedirect?: boolean;
};

/** 엑심베이 DCC 12개국 등: PortOne SDK 지원 통화만 매핑, 나머지는 USD */
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

/** PortOne 엑심베이(Eximbay) 채널: 카드 결제용 payMethod (SDK 타입에 없어 단언) */
const EXIMBAY_CREDIT_CARD = "PAYMENTWALL_CREDIT_CARD" as const;

/**
 * 엑심베이(Eximbay) 전용 결제 요청. PortOne 브라우저 SDK 호출.
 * 엑심베이 채널은 buyer_name/buyer_email 필수, forceRedirect 미지원.
 */
export async function requestPortonePayment(params: PortonePayParams): Promise<void> {
  const requestParams = {
    storeId: params.storeId,
    channelKey: params.channelKey,
    paymentId: params.paymentId,
    orderName: params.orderName,
    totalAmount: params.totalAmount,
    currency: mapToPortoneCurrency(params.currency),
    payMethod: EXIMBAY_CREDIT_CARD,
    redirectUrl: params.redirectUrl,
    customer: {
      fullName: params.guestName || "Guest",
      email: params.guestEmail,
    },
  } as const;

  await portoneRequestPayment(
    requestParams as unknown as Parameters<typeof portoneRequestPayment>[0]
  );
}
