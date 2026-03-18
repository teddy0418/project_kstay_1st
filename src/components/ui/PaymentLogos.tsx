 "use client";

import Image from "next/image";

type LogoProps = { className?: string };

/** 글로벌 카드: VISA, Mastercard, JCB, AMEX (Eximbay 가이드라인) */
export function CardBrandLogos({ className }: LogoProps) {
  return (
    <div className={`flex flex-wrap items-center gap-2 ${className ?? ""}`}>
      <Image src="/brands/visa.svg.png" alt="Visa" width={40} height={16} className="h-4 w-auto object-contain opacity-90" />
      <Image src="/brands/mastercard.svg.png" alt="Mastercard" width={40} height={16} className="h-4 w-auto object-contain opacity-90" />
      <Image src="/brands/jcb.svg.png" alt="JCB" width={40} height={16} className="h-4 w-auto object-contain opacity-90" />
      <Image src="/brands/amex.svg.png" alt="American Express" width={40} height={16} className="h-4 w-auto object-contain opacity-90" />
    </div>
  );
}

export function PayPalLogo({ className }: LogoProps) {
  return (
    <Image
      src="/brands/paypal.svg.png"
      alt="PayPal"
      width={72}
      height={24}
      className={`h-6 w-auto object-contain opacity-90 ${className ?? ""}`}
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
    <Image
      src="/brands/alipayhk.svg.png"
      alt="Alipay HK"
      width={64}
      height={20}
      className={`h-5 w-auto object-contain opacity-90 ${className ?? ""}`}
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
    <Image
      src="/brands/tng.svg.png"
      alt="Touch 'n Go"
      width={96}
      height={32}
      className={`h-8 w-auto object-contain opacity-90 ${className ?? ""}`}
    />
  );
}

export function DanaLogo({ className }: LogoProps) {
  return (
    <Image
      src="/brands/dana.svg.png"
      alt="DANA"
      width={64}
      height={20}
      className={`h-5 w-auto object-contain opacity-90 ${className ?? ""}`}
    />
  );
}

export function GCashLogo({ className }: LogoProps) {
  return (
    <Image
      src="/brands/gcash.svg.png"
      alt="GCash"
      width={64}
      height={20}
      className={`h-5 w-auto object-contain opacity-90 ${className ?? ""}`}
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
    <Image
      src="/brands/paypay.svg.png"
      alt="PayPay"
      width={72}
      height={24}
      className={`h-6 w-auto object-contain opacity-90 ${className ?? ""}`}
    />
  );
}

export function EcontextLogo({ className }: LogoProps) {
  return (
    <Image
      src="/brands/econtext.svg.png"
      alt="econtext"
      width={72}
      height={24}
      className={`h-6 w-auto object-contain opacity-90 ${className ?? ""}`}
    />
  );
}

