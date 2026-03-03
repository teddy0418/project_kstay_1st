"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { apiClient, ApiClientError } from "@/lib/api/client";
import { useAuth } from "@/components/ui/AuthProvider";
import { useAuthModal } from "@/components/ui/AuthModalProvider";
import { useCurrency } from "@/components/ui/CurrencyProvider";
import { useI18n } from "@/components/ui/LanguageProvider";
import { requestPortonePayment, type PortonePayParams } from "@/lib/portone/requestPayment";
import {
  CardBrandLogos,
  PayPalLogo,
  LinePayLogo,
  AlipayHKLogo,
  PromptPayLogo,
  KakaoPayLogo,
} from "@/components/ui/PaymentLogos";

type UiPaymentId = "KAKAOPAY" | "CARD" | "LINEPAY" | "ALIPAYHK" | "PROMPTPAY" | "PAYPAL";

type Props = {
  listingId: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  isNonRefundableSpecial?: boolean;
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
  const { user, isAuthed } = useAuth();
  const { open: openAuthModal } = useAuthModal();
  const { currency } = useCurrency();
  const { t, lang } = useI18n();

  const checkoutNextUrl = useMemo(
    () =>
      `/checkout?listingId=${encodeURIComponent(props.listingId)}&start=${encodeURIComponent(props.checkIn)}&end=${encodeURIComponent(props.checkOut)}&guests=${props.guests}${props.isNonRefundableSpecial ? "&special=1" : ""}`,
    [props.listingId, props.checkIn, props.checkOut, props.guests, props.isNonRefundableSpecial]
  );

  const c =
    lang === "ko"
      ? {
          payment: "결제",
          desc: "MVP에서는 모의 결제 흐름이며, 추후 PortOne 웹훅 검증으로 대체됩니다.",
          email: "게스트 이메일 (필수)",
          emailHint: "예약 확정·인보이스 메일을 받을 주소",
          name: "게스트 이름 (필수)",
          messageToHost: "호스트에게 보낼 메시지 (선택)",
          messageToHostPh: "예: 체크인 시간 문의, 특별 요청 등",
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
            email: "ゲストメール（必須）",
            emailHint: "予約確認・請求書メールの送信先",
            name: "ゲスト名（必須）",
            messageToHost: "ホストへのメッセージ（任意）",
            messageToHostPh: "例: チェックイン時間の問い合わせ、ご要望など",
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
              email: "客人邮箱（必填）",
              emailHint: "接收预订确认及发票邮件的地址",
              name: "客人姓名（必填）",
              messageToHost: "给房东的留言（选填）",
              messageToHostPh: "例：入住时间咨询、特殊需求等",
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
              email: "Guest email (required)",
              emailHint: "Address for booking confirmation and invoice",
              name: "Guest name (required)",
              messageToHost: "Message to host (optional)",
              messageToHostPh: "e.g. check-in time, special requests",
              emailPh: "you@example.com",
              namePh: "Guest name",
              processing: "Processing...",
              payNow: "Pay now",
              disclaimer: "Actual charge may vary slightly due to card issuer exchange rates.",
              paymentNotCompleted: "Payment was not completed.",
              requestFailed: "Payment request failed.",
              guestFallback: "Guest",
            };

  const isMock = (process.env.NEXT_PUBLIC_PAYMENT_PROVIDER || "MOCK").toUpperCase() === "MOCK";
  const [guestName, setGuestName] = useState(user?.name ?? "");
  const [guestMessageToHost, setGuestMessageToHost] = useState("");
  const [guestEmail, setGuestEmail] = useState(() => user?.email ?? "");
  const [uiPayment, setUiPayment] = useState<UiPaymentId>("CARD");
  const [paying, setPaying] = useState(false);
  const [payModalOpen, setPayModalOpen] = useState(false);
  const [payParams, setPayParams] = useState<PortonePayParams | null>(null);
  const [payModalError, setPayModalError] = useState<string | null>(null);
  const emailReadonly = Boolean(user?.email);

  const paymentOptions: Array<{
    id: UiPaymentId;
    base: "KAKAOPAY" | "PAYPAL" | "EXIMBAY";
    label: string;
    sub: string;
    showCardBrands?: boolean;
  }> =
    lang === "ko"
      ? [
          {
            id: "CARD",
            base: "EXIMBAY",
            label: "신용/체크카드 (해외)",
            sub: "Visa, Mastercard, Amex",
            showCardBrands: true,
          },
          {
            id: "LINEPAY",
            base: "EXIMBAY",
            label: "LINE Pay",
            sub: "일부 국가에서만 지원",
          },
          {
            id: "ALIPAYHK",
            base: "EXIMBAY",
            label: "AlipayHK",
            sub: "홍콩 전자지갑",
          },
          {
            id: "PROMPTPAY",
            base: "EXIMBAY",
            label: "PromptPay",
            sub: "태국 QR 결제",
          },
          {
            id: "PAYPAL",
            base: "PAYPAL",
            label: "PayPal",
            sub: "글로벌 전자지갑",
          },
          {
            id: "KAKAOPAY",
            base: "KAKAOPAY",
            label: "카카오페이",
            sub: "국내 간편결제",
          },
        ]
      : [
          {
            id: "CARD",
            base: "EXIMBAY",
            label: "International cards",
            sub: "Visa, Mastercard, Amex",
            showCardBrands: true,
          },
          {
            id: "LINEPAY",
            base: "EXIMBAY",
            label: "LINE Pay",
            sub: "Selected countries",
          },
          {
            id: "ALIPAYHK",
            base: "EXIMBAY",
            label: "AlipayHK",
            sub: "Hong Kong wallet",
          },
          {
            id: "PROMPTPAY",
            base: "EXIMBAY",
            label: "PromptPay",
            sub: "Thailand QR payment",
          },
          {
            id: "PAYPAL",
            base: "PAYPAL",
            label: "PayPal",
            sub: "Global wallet",
          },
          {
            id: "KAKAOPAY",
            base: "KAKAOPAY",
            label: "KakaoPay",
            sub: "Korea only",
          },
        ];

  const selectedOption =
    paymentOptions.find((opt) => opt.id === uiPayment) ?? paymentOptions[0];
  const paymentMethod = selectedOption.base;

  const onOpenPaymentWindow = useCallback(async () => {
    if (!payParams || paying) return;
    setPaying(true);
    setPayModalError(null);
    try {
      await requestPortonePayment(payParams);
      setPayModalOpen(false);
      setPayParams(null);
    } catch (sdkErr) {
      const msg = sdkErr instanceof Error ? sdkErr.message : String(sdkErr);
      setPayModalError(msg);
    }
    setPaying(false);
  }, [payParams, paying]);

  useEffect(() => {
    if (user?.email) setGuestEmail(user.email);
  }, [user?.email]);

  const canPay = useMemo(() => {
    return (
      props.listingId.length > 0 &&
      props.checkIn.length > 0 &&
      props.checkOut.length > 0 &&
      guestEmail.includes("@") &&
      guestName.trim().length >= 1
    );
  }, [props.listingId, props.checkIn, props.checkOut, guestEmail, guestName]);

  const onPayNow = async () => {
    if (paying) return;
    if (!canPay) {
      const msg =
        !guestEmail.includes("@")
          ? lang === "ko"
            ? "이메일을 입력해 주세요."
            : "Please enter your email."
          : guestName.trim().length < 1
            ? lang === "ko"
              ? "게스트 이름을 입력해 주세요."
              : "Please enter guest name."
            : lang === "ko"
              ? "일정을 선택한 뒤 예약하기로 체크아웃에 진입해 주세요."
              : "Select dates and use Reserve to reach checkout.";
      alert(msg);
      return;
    }
    setPaying(true);

    try {
      const created = await apiClient.post<CreateBookingResponse>("/api/bookings", {
        listingId: props.listingId,
        checkIn: props.checkIn,
        checkOut: props.checkOut,
        guestEmail,
        guestName: guestName.trim(),
        guestMessageToHost: guestMessageToHost.trim() || undefined,
        guestsAdults: Math.max(1, props.guests),
        guestsChildren: 0,
        guestsInfants: 0,
        guestsPets: 0,
        currency,
        paymentMethod,
        isNonRefundableSpecial: props.isNonRefundableSpecial ?? false,
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

        const params: PortonePayParams = {
          storeId: created.portone.storeId,
          channelKey: created.portone.channelKey,
          paymentId: created.portone.paymentId,
          orderName: created.portone.orderName,
          totalAmount: created.portone.totalAmount,
          currency: created.portone.currency,
          redirectUrl: created.portone.redirectUrl,
          forceRedirect: created.portone.forceRedirect,
          paymentMethod,
          guestName: guestName.trim() || user?.name || c.guestFallback,
          guestEmail,
        };
        if (typeof localStorage !== "undefined") {
          localStorage.setItem("kstay_portone_pay_params", JSON.stringify(params));
        }
        setPayParams(params);
        setPayModalOpen(true);
        setPayModalError(null);
        setPaying(false);
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

  if (!isAuthed) {
    return (
      <section className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
        <p className="text-sm text-neutral-600">{t("login_required_checkout")}</p>
        <button
          type="button"
          onClick={() => openAuthModal({ next: checkoutNextUrl, role: "GUEST" })}
          className="mt-4 w-full rounded-xl bg-neutral-900 px-4 py-3 text-sm font-semibold text-white hover:opacity-95 transition"
        >
          {t("login_signup")}
        </button>
      </section>
    );
  }

  return (
    <aside className="relative h-fit rounded-2xl border border-neutral-200 p-6 shadow-soft">
      {paying && (
        <div className="absolute inset-0 z-10 flex items-center justify-center rounded-2xl bg-white/90">
          <span className="text-sm font-medium text-neutral-700">{c.processing}</span>
        </div>
      )}
      <div className="text-sm font-semibold">{c.payment}</div>
      <p className="mt-2 text-sm text-neutral-600">
        {c.desc}
      </p>

      <div className="mt-4 grid gap-3">
        <div className="rounded-xl border border-neutral-200 px-3 py-2">
          <label className="text-xs font-semibold text-neutral-500">
            {lang === "ko" ? "결제 수단" : lang === "ja" ? "支払い方法" : lang === "zh" ? "支付方式" : "Payment method"}
            {isMock && (
              <span className="ml-2 text-amber-600">
                ({lang === "ko" ? "테스트 모드" : "Test mode"})
              </span>
            )}
          </label>

          <div className="mt-3 space-y-2">
            {paymentOptions.map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setUiPayment(opt.id)}
                className={`flex w-full items-center justify-between gap-3 rounded-lg border px-3 py-2.5 text-left text-sm transition ${
                  uiPayment === opt.id
                    ? "border-neutral-900 bg-neutral-50"
                    : "border-neutral-200 bg-white hover:bg-neutral-50"
                }`}
              >
                <div className="flex min-w-0 flex-1 flex-col items-start gap-0.5">
                  <span className="font-medium">{opt.label}</span>
                  <span className="text-[11px] text-neutral-500">{opt.sub}</span>
                </div>
                <div className="shrink-0">
                  {opt.id === "CARD" && <CardBrandLogos />}
                  {opt.id === "PAYPAL" && <PayPalLogo />}
                  {opt.id === "LINEPAY" && <LinePayLogo />}
                  {opt.id === "ALIPAYHK" && <AlipayHKLogo />}
                  {opt.id === "PROMPTPAY" && <PromptPayLogo />}
                  {opt.id === "KAKAOPAY" && <KakaoPayLogo />}
                </div>
              </button>
            ))}
          </div>
        </div>
        <div className="rounded-xl border border-neutral-200 px-3 py-2">
          <label className="text-xs font-semibold text-neutral-500">{c.email}</label>
          <input
            value={guestEmail}
            onChange={(e) => setGuestEmail(e.target.value)}
            readOnly={emailReadonly}
            className="mt-1 w-full text-sm outline-none read-only:text-neutral-500"
            placeholder={c.emailPh}
            aria-describedby="checkout-email-hint"
          />
          <p id="checkout-email-hint" className="mt-0.5 text-[11px] text-neutral-400">{c.emailHint}</p>
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
        <div className="rounded-xl border border-neutral-200 px-3 py-2">
          <label className="text-xs font-semibold text-neutral-500">{c.messageToHost}</label>
          <textarea
            value={guestMessageToHost}
            onChange={(e) => setGuestMessageToHost(e.target.value)}
            placeholder={c.messageToHostPh}
            rows={3}
            className="mt-1 w-full resize-y text-sm outline-none placeholder:text-neutral-400"
          />
        </div>
      </div>

      <p className="mt-3 text-xs text-neutral-500">* {c.disclaimer}</p>

      {!canPay && !paying && (
        <p className="mt-3 text-xs text-amber-600">
          {!guestEmail.includes("@")
            ? lang === "ko"
              ? "이메일을 입력해 주세요."
              : "Please enter your email."
            : guestName.trim().length < 1
              ? lang === "ko"
                ? "게스트 이름을 입력해 주세요."
                : "Please enter guest name."
              : lang === "ko"
                ? "일정을 선택한 뒤 예약하기로 체크아웃에 진입해 주세요."
                : "Select dates and use Reserve to reach checkout."}
        </p>
      )}
      <button
        type="button"
        onClick={onPayNow}
        disabled={paying}
        className="mt-4 w-full rounded-xl bg-brand px-4 py-3 text-sm font-semibold text-brand-foreground hover:opacity-95 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {paying ? c.processing : c.payNow}
      </button>

      {payModalOpen &&
        payParams &&
        typeof document !== "undefined" &&
        createPortal(
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
            <button
              type="button"
              aria-label="Close"
              onClick={() => {
                setPayModalOpen(false);
                setPayParams(null);
                setPayModalError(null);
              }}
              className="absolute inset-0 bg-black/40"
            />
            <div
              className="relative w-full max-w-sm rounded-2xl border border-neutral-200 bg-white p-6 shadow-xl"
              onMouseDown={(e) => e.stopPropagation()}
            >
              <p className="text-center text-sm font-medium text-neutral-800">
                {lang === "ko"
                  ? "결제 진행"
                  : lang === "ja"
                    ? "決済を進める"
                    : lang === "zh"
                      ? "继续支付"
                      : "Proceed to payment"}
              </p>
              {payModalError && (
                <div className="mt-3 space-y-1 rounded-lg bg-amber-50 px-3 py-2 text-center text-sm text-amber-800">
                  <p>{payModalError}</p>
                  <a
                    href={payParams ? `/checkout/pay?token=${encodeURIComponent(payParams.paymentId)}` : "#"}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block text-brand underline hover:no-underline"
                  >
                    {lang === "ko"
                      ? "팝업이 차단된 경우 새 탭에서 결제 시도"
                      : lang === "ja"
                        ? "ポップアップがブロックされた場合は新しいタブでお支払い"
                        : lang === "zh"
                          ? "若弹窗被拦截，请在新标签页中完成支付"
                          : "Try payment in new tab (if popup blocked)"}
                  </a>
                </div>
              )}
              <button
                type="button"
                onClick={onOpenPaymentWindow}
                disabled={paying}
                className="mt-4 w-full rounded-xl bg-brand px-4 py-3 text-sm font-semibold text-brand-foreground hover:opacity-95 disabled:opacity-50"
              >
                {paying
                  ? (lang === "ko" ? "열림..." : lang === "ja" ? "開いています..." : lang === "zh" ? "正在打开…" : "Opening...")
                  : lang === "ko"
                    ? "결제창 열기"
                    : lang === "ja"
                      ? "決済画面を開く"
                      : lang === "zh"
                        ? "打开支付窗口"
                        : "Open payment window"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setPayModalOpen(false);
                  setPayParams(null);
                  setPayModalError(null);
                }}
                className="mt-2 w-full rounded-xl border border-neutral-200 py-2.5 text-sm font-medium text-neutral-600 hover:bg-neutral-50"
              >
                {lang === "ko" ? "취소" : lang === "ja" ? "キャンセル" : lang === "zh" ? "取消" : "Cancel"}
              </button>
            </div>
          </div>,
          document.body
        )}
    </aside>
  );
}
