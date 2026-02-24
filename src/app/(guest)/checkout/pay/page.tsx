"use client";

import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Container from "@/components/layout/Container";
import { useI18n } from "@/components/ui/LanguageProvider";
import { requestPortonePayment, type PortonePayParams } from "@/lib/portone/requestPayment";

const STORAGE_KEY = "kstay_portone_pay_params";

export default function CheckoutPayPage() {
  const searchParams = useSearchParams();
  const { lang } = useI18n();
  const [params, setParams] = useState<PortonePayParams | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [paying, setPaying] = useState(false);

  const c =
    lang === "ko"
      ? {
          title: "결제 진행",
          desc: "아래 버튼을 클릭하면 결제 창이 열립니다. 팝업이 차단되면 주소창 옆 아이콘에서 이 사이트 허용 후 다시 시도해 주세요.",
          payNow: "결제창 열기",
          processing: "결제창을 여는 중...",
          requestFailed: "결제 요청에 실패했습니다.",
          paymentNotCompleted: "결제가 완료되지 않았습니다.",
          invalidSession: "결제 정보가 없습니다. 체크아웃 페이지에서 다시 시도해 주세요.",
          backToCheckout: "체크아웃으로 돌아가기",
        }
      : lang === "ja"
        ? {
            title: "決済を進める",
            desc: "下のボタンをクリックすると決済画面が開きます。",
            payNow: "決済画面を開く",
            processing: "決済画面を開いています...",
            requestFailed: "決済リクエストに失敗しました。",
            paymentNotCompleted: "決済が完了しませんでした。",
            invalidSession: "決済情報がありません。チェックアウトページから再度お試しください。",
            backToCheckout: "チェックアウトに戻る",
          }
        : lang === "zh"
          ? {
              title: "继续支付",
              desc: "点击下方按钮将打开支付窗口。",
              payNow: "打开支付窗口",
              processing: "正在打开支付窗口...",
              requestFailed: "支付请求失败。",
              paymentNotCompleted: "支付未完成。",
              invalidSession: "无支付信息。请从结账页面重试。",
              backToCheckout: "返回结账",
            }
          : {
              title: "Complete payment",
              desc: "Click the button below to open the payment window. If blocked, allow popups for this site and try again.",
              payNow: "Open payment window",
              processing: "Opening payment window...",
              requestFailed: "Payment request failed.",
              paymentNotCompleted: "Payment was not completed.",
              invalidSession: "No payment info. Please try again from checkout.",
              backToCheckout: "Back to checkout",
            };

  useEffect(() => {
    const token = searchParams.get("token");
    const invalidMsg = c.invalidSession;
    if (!token) {
      setError(invalidMsg);
      return;
    }
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        setError(invalidMsg);
        return;
      }
      const parsed = JSON.parse(raw) as PortonePayParams;
      if (parsed.paymentId !== token) {
        setError(invalidMsg);
        return;
      }
      setParams(parsed);
    } catch {
      setError(invalidMsg);
    }
  }, [searchParams, lang]);

  const onPayNow = useCallback(async () => {
    if (!params || paying) return;
    setPaying(true);
    setError(null);
    try {
      await requestPortonePayment(params);
    } catch (sdkErr) {
      const msg = sdkErr instanceof Error ? sdkErr.message : String(sdkErr);
      setError(msg);
    }
    setPaying(false);
  }, [params, paying]);

  if (error && !params) {
    return (
      <Container className="py-12">
        <h1 className="text-2xl font-semibold tracking-tight">{c.title}</h1>
        <p className="mt-4 text-sm text-amber-600">{error}</p>
        <a
          href="/"
          className="mt-6 inline-flex rounded-xl bg-neutral-900 px-5 py-3 text-sm font-semibold text-white hover:opacity-90"
        >
          {c.backToCheckout}
        </a>
      </Container>
    );
  }

  if (!params) {
    return (
      <Container className="py-12">
        <h1 className="text-2xl font-semibold tracking-tight">{c.title}</h1>
        <p className="mt-4 text-sm text-neutral-600">Loading...</p>
      </Container>
    );
  }

  return (
    <Container className="py-12">
      <h1 className="text-2xl font-semibold tracking-tight">{c.title}</h1>
      <p className="mt-2 text-sm text-neutral-600">{c.desc}</p>

      {error && (
        <p className="mt-4 text-sm text-amber-600">{error}</p>
      )}

      <button
        type="button"
        onClick={onPayNow}
        disabled={paying}
        className="mt-6 w-full max-w-sm rounded-xl bg-brand px-6 py-4 text-base font-semibold text-brand-foreground hover:opacity-95 disabled:opacity-50"
      >
        {paying ? c.processing : c.payNow}
      </button>

      <a
        href="/"
        className="mt-4 inline-block text-sm text-neutral-600 underline hover:text-neutral-900"
      >
        {c.backToCheckout}
      </a>
    </Container>
  );
}
