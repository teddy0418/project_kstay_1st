 "use client";

type LogoProps = { className?: string };

/** 글로벌 카드: VISA, Mastercard, JCB, AMEX (Eximbay 가이드라인) */
export function CardBrandLogos({ className }: LogoProps) {
  return (
    <div className={`flex flex-wrap items-center gap-2 ${className ?? ""}`}>
      <img
        src="/brands/visa.svg.png"
        alt="Visa"
        className="h-4 w-auto max-w-[40px] object-contain opacity-90"
        loading="lazy"
        decoding="async"
      />
      <img
        src="/brands/mastercard.svg.png"
        alt="Mastercard"
        className="h-4 w-auto max-w-[40px] object-contain opacity-90"
        loading="lazy"
        decoding="async"
      />
      <img
        src="/brands/jcb.svg.png"
        alt="JCB"
        className="h-4 w-auto max-w-[40px] object-contain opacity-90"
        loading="lazy"
        decoding="async"
      />
      <img
        src="/brands/amex.svg.png"
        alt="American Express"
        className="h-4 w-auto max-w-[40px] object-contain opacity-90"
        loading="lazy"
        decoding="async"
      />
    </div>
  );
}

export function PayPalLogo({ className }: LogoProps) {
  return (
    <img
      src="/brands/paypal.svg.png"
      alt="PayPal"
      className={`h-6 w-auto max-w-[72px] object-contain opacity-90 ${className ?? ""}`}
      loading="lazy"
      decoding="async"
    />
  );
}

export function LinePayLogo({ className }: LogoProps) {
  return (
    <span
      className={`inline-flex h-5 items-center justify-center rounded-md bg-[#00B900] px-2 text-[10px] font-semibold text-white ${className ?? ""}`}
    >
      LINE Pay
    </span>
  );
}

export function AlipayHKLogo({ className }: LogoProps) {
  return (
    <img
      src="/brands/alipayhk.svg.png"
      alt="Alipay HK"
      className={`h-5 w-auto max-w-[64px] object-contain opacity-90 ${className ?? ""}`}
      loading="lazy"
      decoding="async"
    />
  );
}

export function PromptPayLogo({ className }: LogoProps) {
  return (
    <span
      className={`inline-flex h-5 items-center justify-center rounded-md bg-[#1E3264] px-2 text-[10px] font-semibold text-white ${className ?? ""}`}
    >
      PromptPay
    </span>
  );
}

export function KakaoPayLogo({ className }: LogoProps) {
  return (
    <span
      className={`inline-flex h-5 items-center justify-center rounded-md bg-[#FEE500] px-2 text-[10px] font-semibold text-[#191919] ${className ?? ""}`}
    >
      KakaoPay
    </span>
  );
}

export function TouchNGoLogo({ className }: LogoProps) {
  return (
    <img
      src="/brands/tng.svg.png"
      alt="Touch 'n Go"
      className={`h-8 w-auto max-w-[96px] object-contain opacity-90 ${className ?? ""}`}
      loading="lazy"
      decoding="async"
    />
  );
}

export function DanaLogo({ className }: LogoProps) {
  return (
    <img
      src="/brands/dana.svg.png"
      alt="DANA"
      className={`h-5 w-auto max-w-[64px] object-contain opacity-90 ${className ?? ""}`}
      loading="lazy"
      decoding="async"
    />
  );
}

export function GCashLogo({ className }: LogoProps) {
  return (
    <img
      src="/brands/gcash.svg.png"
      alt="GCash"
      className={`h-5 w-auto max-w-[64px] object-contain opacity-90 ${className ?? ""}`}
      loading="lazy"
      decoding="async"
    />
  );
}

export function TrueMoneyLogo({ className }: LogoProps) {
  return (
    <span
      className={`inline-flex h-5 items-center justify-center rounded-md bg-[#E31837] px-2 text-[10px] font-semibold text-white ${className ?? ""}`}
    >
      TrueMoney
    </span>
  );
}

export function PayPayLogo({ className }: LogoProps) {
  return (
    <img
      src="/brands/paypay.svg.png"
      alt="PayPay"
      className={`h-6 w-auto max-w-[72px] object-contain opacity-90 ${className ?? ""}`}
      loading="lazy"
      decoding="async"
    />
  );
}

export function EcontextLogo({ className }: LogoProps) {
  return (
    <img
      src="/brands/econtext.svg.png"
      alt="econtext"
      className={`h-6 w-auto max-w-[72px] object-contain opacity-90 ${className ?? ""}`}
      loading="lazy"
      decoding="async"
    />
  );
}

