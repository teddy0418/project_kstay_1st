"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { apiClient, ApiClientError } from "@/lib/api/client";
import { formatDateRangeWithLocale } from "@/lib/format";
import { useAuth } from "@/components/ui/AuthProvider";
import { useAuthModal } from "@/components/ui/AuthModalProvider";
import { useCurrency } from "@/components/ui/CurrencyProvider";
import { useI18n } from "@/components/ui/LanguageProvider";
import { useToast } from "@/components/ui/ToastProvider";
import { requestPortonePayment, type PortonePayParams } from "@/lib/portone/requestPayment";
import { getFrozenQuote } from "@/lib/price-freeze";
import {
  CardBrandLogos,
  PayPalLogo,
  AlipayHKLogo,
  TouchNGoLogo,
  DanaLogo,
  GCashLogo,
  PayPayLogo,
  EcontextLogo,
} from "@/components/ui/PaymentLogos";
import CheckoutPriceDisplay from "./CheckoutPriceDisplay";
import type { Currency } from "@/lib/currency";

const NATIONALITIES = [
  { value: "", label: "" },
  { value: "KR", label: "대한민국" },
  { value: "JP", label: "日本" },
  { value: "CN", label: "中国" },
  { value: "US", label: "United States" },
  { value: "TW", label: "台灣" },
  { value: "HK", label: "香港" },
  { value: "SG", label: "Singapore" },
  { value: "TH", label: "Thailand" },
  { value: "MY", label: "Malaysia" },
  { value: "VN", label: "Vietnam" },
  { value: "PH", label: "Philippines" },
  { value: "ID", label: "Indonesia" },
  { value: "GB", label: "United Kingdom" },
  { value: "AU", label: "Australia" },
  { value: "DE", label: "Germany" },
  { value: "OTHER", label: { en: "Other", ko: "기타", ja: "その他", zh: "其他" } },
] as const;

const NATIONALITY_TO_DIAL_CODE: Record<string, string> = {
  KR: "+82",
  JP: "+81",
  CN: "+86",
  US: "+1",
  TW: "+886",
  HK: "+852",
  SG: "+65",
  TH: "+66",
  MY: "+60",
  VN: "+84",
  PH: "+63",
  ID: "+62",
  GB: "+44",
  AU: "+61",
  DE: "+49",
  OTHER: "",
  "": "",
};

/** 통화에 맞는 대표 국가(체크아웃 국가 선택 동기화용) */
const CURRENCY_TO_COUNTRY: Record<Currency, string> = {
  KRW: "KR",
  JPY: "JP",
  USD: "US",
  SGD: "SG",
  HKD: "HK",
  THB: "TH",
  TWD: "TW",
  MYR: "MY",
  VND: "VN",
  PHP: "PH",
  IDR: "ID",
  EUR: "DE",
  GBP: "GB",
  AUD: "AU",
};

/** 엑심베이(Eximbay) 가이드라인: 글로벌카드 / 간편결제 / 일본 econtext */
type UiPaymentId =
  | "CARD"
  | "PAYPAL"
  | "ALIPAYHK"
  | "TNG"
  | "DANA"
  | "GCASH"
  | "PAYPAY"
  | "ECONTEXT";

type SummaryCopy = {
  dates: string;
  selectDates: string;
  guests: string;
  base: string;
  fee: string;
  total: string;
  included: string;
};

type Props = {
  listingId: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  isNonRefundableSpecial?: boolean;
  /** 있으면 좌(금액+결제수단) / 우(개인정보) 2단 레이아웃으로 렌더 */
  summary?: {
    listingTitle: string;
    start: string;
    end: string;
    guests: number;
    baseTotal: number;
    fee: number;
    total: number;
    copy: SummaryCopy;
    isNonRefundableSpecial: boolean;
  };
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
  };
};

export default function CheckoutPaymentCard(props: Props) {
  const router = useRouter();
  const { toast } = useToast();
  const { user, isAuthed } = useAuth();
  const { open: openAuthModal } = useAuthModal();
  const { currency } = useCurrency();
  const { t, lang, locale } = useI18n();

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
          email: "이메일 (필수)",
          emailHint: "인보이스 발송을 위해 입력 부탁드립니다.",
          name: "예약자 이름 (필수)",
          country: "국가 (필수)",
          countryPh: "국가 선택",
          privacyConsent: "개인정보 수집·이용에 동의합니다.",
          phone: "연락처 (선택)",
          phonePh: "예: +82 10-1234-5678",
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
          enterEmail: "이메일을 입력해 주세요.",
          enterName: "예약자 이름을 입력해 주세요.",
          selectCountry: "국가를 선택해 주세요.",
          consentRequired: "개인정보 수집·이용에 동의해 주세요.",
        }
      : lang === "ja"
        ? {
            payment: "支払い",
            desc: "MVP ではモック決済で、後で PortOne webhook 検証に置き換え可能です。",
            email: "メール（必須）",
            emailHint: "請求書送付のためご入力ください。",
            name: "予約者名（必須）",
            country: "国（必須）",
            countryPh: "国を選択",
            privacyConsent: "個人情報の収集・利用に同意します。",
            phone: "連絡先（任意）",
            phonePh: "例: +81 90-1234-5678",
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
            enterEmail: "メールアドレスを入力してください。",
            enterName: "予約者名を入力してください。",
            selectCountry: "国を選択してください。",
            consentRequired: "個人情報の収集・利用にご同意ください。",
          }
        : lang === "zh"
          ? {
              payment: "支付",
              desc: "MVP 阶段使用模拟支付，后续可替换为 PortOne webhook 校验。",
              email: "邮箱（必填）",
              emailHint: "为发送发票，请填写邮箱。",
              name: "预订人姓名（必填）",
              country: "国家（必填）",
              countryPh: "选择国家",
              privacyConsent: "同意收集和使用个人信息。",
              phone: "联系电话（选填）",
              phonePh: "例：+86 138-0000-0000",
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
              enterEmail: "请输入邮箱。",
              enterName: "请输入预订人姓名。",
              selectCountry: "请选择国家。",
              consentRequired: "请同意收集和使用个人信息。",
            }
          : {
              payment: "Payment",
              desc: "In MVP, payment confirmation is mocked and can be replaced by PortOne webhook later.",
              email: "Email (required)",
              emailHint: "Required for sending the invoice.",
              name: "Guest name (required)",
              country: "Country (required)",
              countryPh: "Select country",
              privacyConsent: "I agree to the collection and use of my personal information.",
              phone: "Phone (optional)",
              phonePh: "e.g. +1 555-123-4567",
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
              enterEmail: "Please enter your email.",
              enterName: "Please enter guest name.",
              selectCountry: "Please select country.",
              consentRequired: "Please agree to the privacy policy.",
            };

  const isMock = (process.env.NEXT_PUBLIC_PAYMENT_PROVIDER || "MOCK").toUpperCase() === "MOCK";
  const [guestName, setGuestName] = useState(user?.name ?? "");
  const [guestEmail, setGuestEmail] = useState(() => user?.email ?? "");
  const [guestNationality, setGuestNationality] = useState(user?.nationality ?? "");
  const [guestDialCode, setGuestDialCode] = useState(() => NATIONALITY_TO_DIAL_CODE[user?.nationality ?? ""] ?? "");
  const [guestPhoneLocal, setGuestPhoneLocal] = useState(() => {
    const raw = user?.phone ?? "";
    if (!raw.trim()) return "";
    const trimmed = raw.trim();
    if (trimmed.startsWith("+")) {
      const match = trimmed.match(/^\+[\d]+/);
      const rest = match ? trimmed.slice(match[0].length).trim() : trimmed;
      return rest;
    }
    return trimmed;
  });
  const [privacyConsent, setPrivacyConsent] = useState(false);
  const [guestMessageToHost, setGuestMessageToHost] = useState("");
  const [uiPayment, setUiPayment] = useState<UiPaymentId>("CARD");
  const [paying, setPaying] = useState(false);
  const [payModalOpen, setPayModalOpen] = useState(false);
  const [payParams, setPayParams] = useState<PortonePayParams | null>(null);
  const [frozenTotalKrw, setFrozenTotalKrw] = useState<number | null>(null);

  useEffect(() => {
    const q = getFrozenQuote({
      listingId: props.listingId,
      checkIn: props.checkIn,
      checkOut: props.checkOut,
      guests: props.guests,
    });
    if (q) setFrozenTotalKrw(q.totalKRW);
    else setFrozenTotalKrw(null);
  }, [props.listingId, props.checkIn, props.checkOut, props.guests]);
  const [payModalError, setPayModalError] = useState<string | null>(null);
  const emailReadonly = Boolean(user?.email);

  const nationalityOptions = useMemo(() => {
    const first = NATIONALITIES[0];
    const rest = NATIONALITIES.slice(1);
    const selectLabel =
      lang === "ko" ? "국가 선택" : lang === "ja" ? "国を選択" : lang === "zh" ? "選擇國家" : "Select country";
    const resolveLabel = (l: string | Record<string, string>) =>
      typeof l === "string" ? l : l[lang] ?? l.en ?? "";
    return [{ value: first.value, label: selectLabel }, ...rest.map((n) => ({ value: n.value, label: resolveLabel(n.label) }))];
  }, [lang]);

  /** 엑심베이(Eximbay) 가이드라인: 글로벌 카드 / 간편결제 / 일본 econtext */
  const paymentOptions: Array<{
    id: UiPaymentId;
    label: string;
    sub: string;
    showCardBrands?: boolean;
  }> =
    lang === "ko"
      ? [
          {
            id: "CARD",
            label: "글로벌 카드",
            sub: "",
            showCardBrands: true,
          },
          { id: "PAYPAL", label: "PayPal", sub: "영어권 간편결제" },
          { id: "PAYPAY", label: "PayPay", sub: "일본" },
          { id: "DANA", label: "Dana", sub: "인도네시아" },
          { id: "GCASH", label: "GCash", sub: "필리핀" },
          { id: "TNG", label: "Touch 'n Go", sub: "말레이시아" },
          { id: "ALIPAYHK", label: "Alipay HK", sub: "홍콩" },
          { id: "ECONTEXT", label: "econtext", sub: "일본 편의점·은행 결제" },
        ]
      : [
          {
            id: "CARD",
            label: "Global cards",
            sub: "",
            showCardBrands: true,
          },
          { id: "PAYPAL", label: "PayPal", sub: "Global e-wallet" },
          { id: "PAYPAY", label: "PayPay", sub: "Japan" },
          { id: "DANA", label: "Dana", sub: "Indonesia" },
          { id: "GCASH", label: "GCash", sub: "Philippines" },
          { id: "TNG", label: "Touch 'n Go", sub: "Malaysia" },
          { id: "ALIPAYHK", label: "Alipay HK", sub: "Hong Kong" },
          { id: "ECONTEXT", label: "econtext", sub: "Japan convenience & bank" },
        ];

  const selectedOption =
    paymentOptions.find((opt) => opt.id === uiPayment) ?? paymentOptions[0];
  const paymentMethod = "EXIMBAY" as const;

  const onOpenPaymentWindow = useCallback(async () => {
    if (!payParams || paying) return;
    setPaying(true);
    setPayModalError(null);
    try {
      const result = await requestPortonePayment(payParams);
      if (result.success) {
        setPayModalOpen(false);
        setPayParams(null);
        if (typeof localStorage !== "undefined") {
          localStorage.removeItem("kstay_portone_pay_params");
        }
        router.push(`/checkout/success/${encodeURIComponent(result.paymentId)}`);
        router.refresh();
      } else {
        setPayModalError(result.message || result.code || "Payment was not completed.");
      }
    } catch (sdkErr) {
      const msg = sdkErr instanceof Error ? sdkErr.message : String(sdkErr);
      setPayModalError(msg);
    }
    setPaying(false);
  }, [payParams, paying, router]);

  useEffect(() => {
    if (!user) return;
    if (user.email) setGuestEmail(user.email);
    if (user.name) setGuestName(user.name);
    if (user.nationality) setGuestNationality(user.nationality);
    if (user.nationality) setGuestDialCode(NATIONALITY_TO_DIAL_CODE[user.nationality] ?? "");
    if (user.phone) {
      const raw = user.phone.trim();
      if (raw.startsWith("+")) {
        const match = raw.match(/^\+[\d]+/);
        if (match) {
          setGuestDialCode(match[0]);
          setGuestPhoneLocal(raw.slice(match[0].length).trim());
        } else {
          setGuestPhoneLocal(raw);
        }
      } else {
        setGuestPhoneLocal(raw);
      }
    }
  }, [user?.email, user?.name, user?.nationality, user?.phone]);

  /** 통화에 맞게 국가(국적) 자동 설정: 진입 시·통화 변경 시 */
  useEffect(() => {
    const country = CURRENCY_TO_COUNTRY[currency];
    if (country) setGuestNationality(country);
  }, [currency]);

  useEffect(() => {
    setGuestDialCode(NATIONALITY_TO_DIAL_CODE[guestNationality] ?? "");
  }, [guestNationality]);

  const canPay = useMemo(() => {
    return (
      props.listingId.length > 0 &&
      props.checkIn.length > 0 &&
      props.checkOut.length > 0 &&
      guestEmail.includes("@") &&
      guestName.trim().length >= 1 &&
      guestNationality.trim().length >= 1 &&
      privacyConsent
    );
  }, [props.listingId, props.checkIn, props.checkOut, guestEmail, guestName, guestNationality, privacyConsent]);

  const onPayNow = async () => {
    if (paying) return;
    if (!canPay) {
      const msg = !guestEmail.includes("@")
        ? c.enterEmail
        : guestName.trim().length < 1
          ? c.enterName
          : !guestNationality.trim()
            ? c.selectCountry
            : !privacyConsent
              ? c.consentRequired
              : lang === "ko"
                ? "일정을 선택한 뒤 예약하기로 체크아웃에 진입해 주세요."
                : "Select dates and use Reserve to reach checkout.";
      alert(msg);
      return;
    }
    setPaying(true);

    const fullPhone = (() => {
      const local = guestPhoneLocal.replace(/\D/g, "");
      const dial = guestDialCode.trim();
      if (!local) return null;
      return dial ? `${dial}${local}` : local;
    })();

    try {
      // 최초 결제 시 입력한 예약자 정보를 계정 프로필에 저장
      await apiClient.patch("/api/user/profile", {
        completeOnboarding: true,
        privacyConsent: true,
        name: guestName.trim(),
        email: guestEmail.trim(),
        nationality: guestNationality.trim() || null,
        phone: fullPhone,
      });

      // 카카오페이는 KRW만 지원
      const requestCurrency = currency;

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
        currency: requestCurrency,
        paymentMethod,
        isNonRefundableSpecial: props.isNonRefundableSpecial ?? false,
        ...(frozenTotalKrw != null && frozenTotalKrw > 0 ? { totalKrw: frozenTotalKrw } : {}),
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
      const msg =
        err instanceof ApiClientError
          ? err.message
          : err instanceof Error && err.message
            ? err.message
            : c.requestFailed;
      toast(msg);
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

  const paymentMethodBlock = (
    <div className="rounded-2xl border border-neutral-200 p-6 shadow-soft">
      <label className="text-xs font-semibold text-neutral-500">
        {lang === "ko" ? "결제 수단" : lang === "ja" ? "支払い方法" : lang === "zh" ? "支付方式" : "Payment method"}
        {isMock && (
          <span className="ml-2 text-amber-600">
            ({lang === "ko" ? "테스트 모드" : "Test mode"})
          </span>
        )}
      </label>
      <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
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
              {opt.sub && <span className="text-[11px] text-neutral-500">{opt.sub}</span>}
            </div>
            <div className="shrink-0">
              {opt.id === "CARD" && <CardBrandLogos />}
              {opt.id === "PAYPAL" && <PayPalLogo />}
              {opt.id === "ALIPAYHK" && <AlipayHKLogo />}
              {opt.id === "TNG" && <TouchNGoLogo />}
              {opt.id === "DANA" && <DanaLogo />}
              {opt.id === "GCASH" && <GCashLogo />}
              {opt.id === "PAYPAY" && <PayPayLogo />}
              {opt.id === "ECONTEXT" && <EcontextLogo />}
            </div>
          </button>
        ))}
      </div>
    </div>
  );

  const guestFormBlock = (
    <>
      <div className="text-sm font-semibold">{c.payment}</div>
      <p className="mt-2 text-sm text-neutral-600">{c.desc}</p>
      <div className="mt-4 space-y-3">
        <div className="rounded-xl border border-neutral-200 px-3 py-2">
          <label htmlFor="checkout-name" className="text-xs font-semibold text-neutral-500">{c.name}</label>
          <input
            id="checkout-name"
            value={guestName}
            onChange={(e) => setGuestName(e.target.value)}
            className="mt-1 w-full text-sm outline-none"
            placeholder={c.namePh}
          />
        </div>
        <div className="rounded-xl border border-neutral-200 px-3 py-2">
          <label htmlFor="checkout-country" className="text-xs font-semibold text-neutral-500">{c.country}</label>
          <select
            id="checkout-country"
            value={guestNationality}
            onChange={(e) => setGuestNationality(e.target.value)}
            className="mt-1 w-full text-sm outline-none bg-transparent"
          >
            {nationalityOptions.map((opt) => (
              <option key={opt.value || "empty"} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
        <div className="rounded-xl border border-neutral-200 px-3 py-2">
          <label htmlFor="checkout-email" className="text-xs font-semibold text-neutral-500">{c.email}</label>
          <input
            id="checkout-email"
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
          <label htmlFor="checkout-phone" className="text-xs font-semibold text-neutral-500">{c.phone}</label>
          <div className="mt-1 flex items-center gap-1 rounded-lg border border-transparent bg-transparent">
            <span className="shrink-0 text-sm text-neutral-500 tabular-nums">
              {guestDialCode || (lang === "ko" ? "국가 선택 시 자동" : lang === "ja" ? "国選択で自動" : lang === "zh" ? "選國家後自動" : "Auto when country selected")}
            </span>
            <input
              id="checkout-phone"
              value={guestPhoneLocal}
              onChange={(e) => setGuestPhoneLocal(e.target.value)}
              className="min-w-0 flex-1 text-sm outline-none"
              placeholder={guestDialCode ? (lang === "ko" ? "10-1234-5678" : "1234567890") : c.phonePh}
            />
          </div>
        </div>
        <div className="rounded-xl border border-neutral-200 px-3 py-2">
          <label htmlFor="checkout-message" className="text-xs font-semibold text-neutral-500">{c.messageToHost}</label>
          <textarea
            id="checkout-message"
            value={guestMessageToHost}
            onChange={(e) => setGuestMessageToHost(e.target.value)}
            placeholder={c.messageToHostPh}
            rows={6}
            className="mt-1 w-full min-h-[140px] resize-y text-sm outline-none placeholder:text-neutral-400"
          />
        </div>
      </div>
      <p className="mt-3 text-xs text-neutral-500">* {c.disclaimer}</p>
      {!canPay && !paying && !guestEmail.includes("@") && (
        <p className="mt-3 text-xs text-amber-600">{c.enterEmail}</p>
      )}
      {!canPay && !paying && guestEmail.includes("@") && guestName.trim().length < 1 && (
        <p className="mt-3 text-xs text-amber-600">{c.enterName}</p>
      )}
      {!canPay && !paying && guestEmail.includes("@") && guestName.trim().length >= 1 && !guestNationality.trim() && (
        <p className="mt-3 text-xs text-amber-600">{c.selectCountry}</p>
      )}
      {!canPay && !paying && guestEmail.includes("@") && guestName.trim().length >= 1 && guestNationality.trim() && privacyConsent && (
        <p className="mt-3 text-xs text-amber-600">
          {lang === "ko" ? "일정을 선택한 뒤 예약하기로 체크아웃에 진입해 주세요." : "Select dates and use Reserve to reach checkout."}
        </p>
      )}
      <div className="mt-4 rounded-xl border border-neutral-200 px-3 py-2">
        <label className="flex cursor-pointer items-start gap-2">
          <input
            type="checkbox"
            checked={privacyConsent}
            onChange={(e) => setPrivacyConsent(e.target.checked)}
            className="mt-0.5 shrink-0 rounded border-neutral-300"
          />
          <span className="text-xs font-semibold text-neutral-500">{c.privacyConsent}</span>
        </label>
      </div>
      {!privacyConsent && (
        <p className="mt-2 text-xs text-amber-600">{c.consentRequired}</p>
      )}
      <button
        type="button"
        onClick={onPayNow}
        disabled={paying}
        className="mt-3 w-full rounded-xl bg-brand px-4 py-3 text-sm font-semibold text-brand-foreground hover:bg-neutral-900 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {paying ? c.processing : c.payNow}
      </button>
    </>
  );

  if (props.summary) {
    const base = props.summary;
    const sum =
      frozenTotalKrw != null && frozenTotalKrw > 0
        ? {
            ...base,
            baseTotal: Math.round(frozenTotalKrw / 1.132),
            fee: frozenTotalKrw - Math.round(frozenTotalKrw / 1.132),
            total: frozenTotalKrw,
          }
        : base;
    return (
      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_1fr] lg:items-start">
        <div className="space-y-6 min-w-0">
          <section className="rounded-2xl border border-neutral-200 p-6">
            <div className="text-sm font-semibold">{sum.listingTitle}</div>
            <div className="mt-2 text-sm text-neutral-600">
              {sum.copy.dates}: {sum.start && sum.end ? formatDateRangeWithLocale(locale, sum.start, sum.end) : sum.copy.selectDates} · {sum.copy.guests}: {sum.guests}
            </div>
            {sum.isNonRefundableSpecial && (
              <div className="mt-3 sm:mt-4 rounded-xl border border-amber-200 bg-gradient-to-br from-amber-50 to-amber-50/50 px-3 py-3 sm:px-4 sm:py-3.5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-bold text-amber-900 text-sm sm:text-base">
                    {lang === "ko" ? "할인 특가 적용" : lang === "ja" ? "割引特価適用" : lang === "zh" ? "已享特價優惠" : "Discount rate applied"}
                  </span>
                  <span className="rounded-full bg-amber-200/80 px-2 py-0.5 text-[10px] sm:text-xs font-semibold text-amber-900">
                    {lang === "ko" ? "10% 할인" : lang === "ja" ? "10%OFF" : lang === "zh" ? "9折" : "10% off"}
                  </span>
                </div>
                <p className="mt-1.5 text-[11px] sm:text-xs text-amber-700/90">
                  {lang === "ko" ? "예약 후 24시간 지나면 취소 시 환불 불가" : lang === "ja" ? "予約から24時間経過後のキャンセルは返金不可" : lang === "zh" ? "預訂超過24小時後取消不可退款" : "No refund after 24 hours from booking"}
                </p>
              </div>
            )}
            <CheckoutPriceDisplay baseTotal={sum.baseTotal} fee={sum.fee} total={sum.total} copy={sum.copy} />
          </section>
          {paymentMethodBlock}
        </div>
        <aside className="relative min-w-0 rounded-2xl border border-neutral-200 p-6 shadow-soft">
          {paying && (
            <div className="absolute inset-0 z-10 flex items-center justify-center rounded-2xl bg-white/90">
              <span className="text-sm font-medium text-neutral-700">{c.processing}</span>
            </div>
          )}
          {guestFormBlock}
        </aside>
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
                {lang === "ko" ? "결제 진행" : lang === "ja" ? "決済を進める" : lang === "zh" ? "繼續支付" : "Proceed to payment"}
              </p>
              {payModalError && (
                <div className="mt-3 space-y-1 rounded-lg bg-amber-50 px-3 py-2 text-center text-sm text-amber-800">
                  <p>{payModalError}</p>
                  <a href={payParams ? `/checkout/pay?token=${encodeURIComponent(payParams.paymentId)}` : "#"} target="_blank" rel="noopener noreferrer" className="inline-block text-brand underline hover:no-underline">
                    {lang === "ko" ? "팝업이 차단된 경우 새 탭에서 결제 시도" : lang === "ja" ? "ポップアップがブロックされた場合は新しいタブでお支払い" : lang === "zh" ? "若彈窗被攔截，請在新分頁中完成支付" : "Try payment in new tab (if popup blocked)"}
                  </a>
                </div>
              )}
              <button type="button" onClick={onOpenPaymentWindow} disabled={paying} className="mt-4 w-full rounded-xl bg-brand px-4 py-3 text-sm font-semibold text-brand-foreground hover:opacity-95 disabled:opacity-50">
                {paying ? (lang === "ko" ? "열림..." : lang === "ja" ? "開いています..." : lang === "zh" ? "正在開啟…" : "Opening...") : lang === "ko" ? "결제창 열기" : lang === "ja" ? "決済画面を開く" : lang === "zh" ? "開啟支付視窗" : "Open payment window"}
              </button>
              <button type="button" onClick={() => { setPayModalOpen(false); setPayParams(null); setPayModalError(null); }} className="mt-2 w-full rounded-xl border border-neutral-200 py-2.5 text-sm font-medium text-neutral-600 hover:bg-neutral-50">
                {lang === "ko" ? "취소" : lang === "ja" ? "キャンセル" : lang === "zh" ? "取消" : "Cancel"}
              </button>
            </div>
          </div>,
          document.body
        )}
      </div>
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
      <p className="mt-2 text-sm text-neutral-600">{c.desc}</p>
      <div className="mt-4 grid gap-3">
        {paymentMethodBlock}
        <div className="rounded-xl border border-neutral-200 px-3 py-2">
          <label htmlFor="checkout-name-m" className="text-xs font-semibold text-neutral-500">{c.name}</label>
          <input id="checkout-name-m" value={guestName} onChange={(e) => setGuestName(e.target.value)} className="mt-1 w-full text-sm outline-none" placeholder={c.namePh} />
        </div>
        <div className="rounded-xl border border-neutral-200 px-3 py-2">
          <label htmlFor="checkout-country-m" className="text-xs font-semibold text-neutral-500">{c.country}</label>
          <select id="checkout-country-m" value={guestNationality} onChange={(e) => setGuestNationality(e.target.value)} className="mt-1 w-full text-sm outline-none bg-transparent">
            {nationalityOptions.map((opt) => (
              <option key={opt.value || "empty"} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
        <div className="rounded-xl border border-neutral-200 px-3 py-2">
          <label htmlFor="checkout-email-m" className="text-xs font-semibold text-neutral-500">{c.email}</label>
          <input id="checkout-email-m" value={guestEmail} onChange={(e) => setGuestEmail(e.target.value)} readOnly={emailReadonly} className="mt-1 w-full text-sm outline-none read-only:text-neutral-500" placeholder={c.emailPh} aria-describedby="checkout-email-hint-m" />
          <p id="checkout-email-hint-m" className="mt-0.5 text-[11px] text-neutral-400">{c.emailHint}</p>
        </div>
        <div className="rounded-xl border border-neutral-200 px-3 py-2">
          <label htmlFor="checkout-phone-m" className="text-xs font-semibold text-neutral-500">{c.phone}</label>
          <div className="mt-1 flex items-center gap-1">
            <span className="shrink-0 text-sm text-neutral-500 tabular-nums">{guestDialCode || "—"}</span>
            <input id="checkout-phone-m" value={guestPhoneLocal} onChange={(e) => setGuestPhoneLocal(e.target.value)} className="min-w-0 flex-1 text-sm outline-none" placeholder={guestDialCode ? "10-1234-5678" : c.phonePh} />
          </div>
        </div>
        <div className="rounded-xl border border-neutral-200 px-3 py-2">
          <label htmlFor="checkout-message-m" className="text-xs font-semibold text-neutral-500">{c.messageToHost}</label>
          <textarea id="checkout-message-m" value={guestMessageToHost} onChange={(e) => setGuestMessageToHost(e.target.value)} placeholder={c.messageToHostPh} rows={6} className="mt-1 w-full min-h-[140px] resize-y text-sm outline-none placeholder:text-neutral-400" />
        </div>
      </div>
      <p className="mt-3 text-xs text-neutral-500">* {c.disclaimer}</p>
      {!canPay && !paying && !guestEmail.includes("@") && (
        <p className="mt-3 text-xs text-amber-600">{c.enterEmail}</p>
      )}
      {!canPay && !paying && guestEmail.includes("@") && guestName.trim().length < 1 && (
        <p className="mt-3 text-xs text-amber-600">{c.enterName}</p>
      )}
      {!canPay && !paying && guestEmail.includes("@") && guestName.trim().length >= 1 && !guestNationality.trim() && (
        <p className="mt-3 text-xs text-amber-600">{c.selectCountry}</p>
      )}
      {!canPay && !paying && guestEmail.includes("@") && guestName.trim().length >= 1 && guestNationality.trim() && privacyConsent && (
        <p className="mt-3 text-xs text-amber-600">
          {lang === "ko" ? "일정을 선택한 뒤 예약하기로 체크아웃에 진입해 주세요." : "Select dates and use Reserve to reach checkout."}
        </p>
      )}
      <div className="mt-4 rounded-xl border border-neutral-200 px-3 py-2">
        <label className="flex cursor-pointer items-start gap-2">
          <input type="checkbox" checked={privacyConsent} onChange={(e) => setPrivacyConsent(e.target.checked)} className="mt-0.5 shrink-0 rounded border-neutral-300" />
          <span className="text-xs font-semibold text-neutral-500">{c.privacyConsent}</span>
        </label>
      </div>
      {!privacyConsent && (
        <p className="mt-2 text-xs text-amber-600">{c.consentRequired}</p>
      )}
      <button type="button" onClick={onPayNow} disabled={paying} className="mt-3 w-full rounded-xl bg-brand px-4 py-3 text-sm font-semibold text-brand-foreground hover:bg-neutral-900 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
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
                  ? (lang === "ko" ? "열림..." : lang === "ja" ? "開いています..." : lang === "zh" ? "正在開啟…" : "Opening...")
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
