import { readdir } from "node:fs/promises";
import path from "node:path";
import Image from "next/image";

type Lang = "en" | "ko" | "ja" | "zh";

const LABEL: Record<Lang, string> = {
  en: "SUPPORTED PAYMENTS",
  ko: "지원 결제수단",
  ja: "ご利用可能なお支払い",
  zh: "支持的支付方式",
};

const ORDER: Array<{ key: string; label: string }> = [
  { key: "visa", label: "VISA" },
  { key: "mastercard", label: "Mastercard" },
  { key: "amex", label: "American Express" },
  { key: "jcb", label: "JCB" },
  { key: "paypal", label: "PayPal" },
  // 2번째 줄 시작 (모바일 기준)
  { key: "paypay", label: "PayPay" },
  { key: "tng", label: "Touch 'n Go" },
  { key: "dana", label: "DANA" },
  { key: "gcash", label: "GCash" },
  { key: "truemoney", label: "TrueMoney" },
  { key: "alipayhk", label: "Alipay HK" },
  { key: "econtext", label: "econtext" },
  // future: alipay-cn
];

function pickExistingAsset(files: Set<string>, base: string): string | null {
  const candidates = [
    // preferred
    `${base}.svg`,
    `${base}.png`,
    `${base}.webp`,
    `${base}.jpg`,
    `${base}.jpeg`,
    // tolerate double extensions like "visa.svg.png"
    `${base}.svg.png`,
    `${base}.svg.webp`,
    `${base}.svg.jpg`,
    `${base}.svg.jpeg`,
  ];
  for (const name of candidates) {
    if (files.has(name)) return `/brands/${name}`;
  }
  return null;
}

export default async function SupportedBrandLogos({ lang }: { lang: Lang }) {
  const dir = path.join(process.cwd(), "public", "brands");
  let files: Set<string>;
  try {
    const list = await readdir(dir);
    files = new Set(list);
  } catch {
    return null;
  }

  const logos = ORDER.map((x) => ({ ...x, src: pickExistingAsset(files, x.key) })).filter(
    (x) => Boolean(x.src)
  ) as Array<{ key: string; label: string; src: string }>;

  if (logos.length === 0) return null;

  const firstRowKeys: Array<(typeof ORDER)[number]["key"]> = [
    "visa",
    "mastercard",
    "amex",
    "jcb",
    "paypal",
    "econtext",
  ];

  const byKey = new Map(logos.map((x) => [x.key, x]));
  const firstRow = firstRowKeys
    .map((k) => byKey.get(k))
    .filter((x): x is { key: string; label: string; src: string } => Boolean(x));
  const secondRow = logos.filter((x) => !firstRowKeys.includes(x.key as (typeof firstRowKeys)[number]));

  return (
    <section className="mt-4">
      <div className="rounded-2xl border border-neutral-200 bg-white px-4 py-3 shadow-sm">
        <div className="text-xs font-semibold text-[#E73587] text-center">{LABEL[lang]}</div>
        {/* 모바일: 두 줄 (위/아래), PC: 한 줄로 쭉 나열 */}
        <div className="mt-3">
          {/* 모바일 전용 2줄 배치 (결제 레이아웃 안에 딱 맞게 조금 줄인 크기) */}
          <div className="flex flex-col gap-1.5 xl:hidden">
            <div className="flex w-full items-center justify-center gap-2">
              {firstRow.map((x) => (
                <div key={x.key} aria-label={x.label} title={x.label} className="flex items-center justify-center">
                  <Image
                    src={x.src}
                    alt={x.label}
                    width={x.key === "visa" ? 40 : 64}
                    height={x.key === "visa" ? 12 : 20}
                    className={`object-contain opacity-90 ${
                      x.key === "visa" ? "h-3 w-auto max-w-[40px]" : "h-5 w-auto max-w-[64px]"
                    }`}
                    unoptimized={x.src.endsWith(".svg")}
                  />
                </div>
              ))}
            </div>
            {secondRow.length > 0 && (
              <div className="flex w-full items-center justify-center gap-2">
                {secondRow.map((x) => {
                  const w = x.key === "paypay" || x.key === "tng" ? 72 : x.key === "dana" ? 56 : 64;
                  const h = x.key === "paypay" || x.key === "tng" ? 24 : x.key === "dana" ? 16 : 20;
                  return (
                    <div key={x.key} aria-label={x.label} title={x.label} className="flex items-center justify-center">
                      <Image
                        src={x.src}
                        alt={x.label}
                        width={w}
                        height={h}
                        className={`object-contain opacity-90 ${
                          x.key === "paypay" || x.key === "tng"
                            ? "h-6 w-auto max-w-[72px]"
                            : x.key === "dana"
                            ? "h-4 w-auto max-w-[56px]"
                            : "h-5 w-auto max-w-[64px]"
                        }`}
                        unoptimized={x.src.endsWith(".svg")}
                      />
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* PC 이상: 모든 로고를 한 줄에서, 결제 레이아웃 안에 들어가도록 적당한 크기로 배치 */}
          <div className="hidden xl:flex w-full items-center justify-center gap-6 md:gap-8">
            {logos.map((x) => {
              const w = x.key === "visa" ? 56 : x.key === "paypay" || x.key === "tng" ? 96 : x.key === "mastercard" || x.key === "dana" || x.key === "gcash" ? 88 : x.key === "alipayhk" ? 72 : 80;
              const h = x.key === "visa" ? 20 : x.key === "paypay" || x.key === "tng" ? 32 : x.key === "mastercard" || x.key === "dana" || x.key === "gcash" ? 28 : x.key === "alipayhk" ? 20 : 24;
              return (
                <div key={x.key} aria-label={x.label} title={x.label} className="flex items-center justify-center">
                  <Image
                    src={x.src}
                    alt={x.label}
                    width={w}
                    height={h}
                    className={`object-contain opacity-90 ${
                      x.key === "visa"
                        ? "h-5 w-auto max-w-[56px]"
                        : x.key === "paypay" || x.key === "tng"
                        ? "h-8 w-auto max-w-[96px]"
                        : x.key === "mastercard" ||
                          x.key === "dana" ||
                          x.key === "gcash"
                        ? "h-7 w-auto max-w-[88px]"
                        : x.key === "alipayhk"
                        ? "h-5 w-auto max-w-[72px]"
                        : "h-6 w-auto max-w-[80px]"
                    }`}
                    unoptimized={x.src.endsWith(".svg")}
                  />
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

