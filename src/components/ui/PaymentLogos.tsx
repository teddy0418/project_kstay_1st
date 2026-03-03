"use client";

type LogoProps = { className?: string };

export function CardBrandLogos({ className }: LogoProps) {
  return (
    <div className={`flex items-center gap-1 ${className ?? ""}`}>
      <span className="inline-flex h-5 items-center justify-center rounded-md bg-[#1A1F71] px-2 text-[10px] font-semibold text-white">
        Visa
      </span>
      <span className="inline-flex h-5 items-center justify-center rounded-md bg-[#EB001B] px-2 text-[10px] font-semibold text-white">
        Master
      </span>
      <span className="inline-flex h-5 items-center justify-center rounded-md bg-[#2E77BB] px-2 text-[10px] font-semibold text-white">
        Amex
      </span>
    </div>
  );
}

export function PayPalLogo({ className }: LogoProps) {
  return (
    <span
      className={`inline-flex h-6 items-center justify-center rounded-md bg-[#003087] px-2.5 text-[11px] font-semibold text-[#FFC439] ${className ?? ""}`}
    >
      PayPal
    </span>
  );
}

export function LinePayLogo({ className }: LogoProps) {
  return (
    <span
      className={`inline-flex h-6 items-center justify-center rounded-md bg-[#00B900] px-2.5 text-[11px] font-semibold text-white ${className ?? ""}`}
    >
      LINE Pay
    </span>
  );
}

export function AlipayHKLogo({ className }: LogoProps) {
  return (
    <span
      className={`inline-flex h-6 items-center justify-center rounded-md bg-[#1677FF] px-2.5 text-[11px] font-semibold text-white ${className ?? ""}`}
    >
      AlipayHK
    </span>
  );
}

export function PromptPayLogo({ className }: LogoProps) {
  return (
    <span
      className={`inline-flex h-6 items-center justify-center rounded-md bg-[#1E3264] px-2.5 text-[11px] font-semibold text-white ${className ?? ""}`}
    >
      PromptPay
    </span>
  );
}

export function KakaoPayLogo({ className }: LogoProps) {
  return (
    <span
      className={`inline-flex h-6 items-center justify-center rounded-md bg-[#FEE500] px-2.5 text-[11px] font-semibold text-[#191919] ${className ?? ""}`}
    >
      KakaoPay
    </span>
  );
}

