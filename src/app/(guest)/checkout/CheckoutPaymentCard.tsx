"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { apiClient, ApiClientError } from "@/lib/api/client";
import { useAuth } from "@/components/ui/AuthProvider";
import { useCurrency } from "@/components/ui/CurrencyProvider";
import { useI18n } from "@/components/ui/LanguageProvider";
import { requestPortonePayment, type PortonePayParams } from "@/lib/portone/requestPayment";

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

  const isMock = (process.env.NEXT_PUBLIC_PAYMENT_PROVIDER || "MOCK").toUpperCase() === "MOCK";
  const [guestName, setGuestName] = useState(user?.name ?? "");
  const [guestEmail, setGuestEmail] = useState(() => user?.email ?? "test@example.com");
  const [paymentMethod, setPaymentMethod] = useState<"KAKAOPAY" | "PAYPAL" | "EXIMBAY">("KAKAOPAY");
  const [paying, setPaying] = useState(false);
  const [payModalOpen, setPayModalOpen] = useState(false);
  const [payParams, setPayParams] = useState<PortonePayParams | null>(null);
  const [payModalError, setPayModalError] = useState<string | null>(null);
  const emailReadonly = Boolean(user?.email);

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
    return props.listingId.length > 0 && props.checkIn.length > 0 && props.checkOut.length > 0 && guestEmail.includes("@");
  }, [props.listingId, props.checkIn, props.checkOut, guestEmail]);

  const onPayNow = async () => {
    if (paying) return;
    if (!canPay) {
      alert(
        !guestEmail.includes("@")
          ? (lang === "ko" ? "이메일을 입력해 주세요." : "Please enter your email.")
          : (lang === "ko" ? "일정을 선택한 뒤 예약하기로 체크아웃에 진입해 주세요." : "Select dates and use Reserve to reach checkout.")
      );
      return;
    }
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

      {!canPay && !paying && (
        <p className="mt-3 text-xs text-amber-600">
          {!guestEmail.includes("@")
            ? lang === "ko"
              ? "이메일을 입력해 주세요."
              : "Please enter your email."
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
