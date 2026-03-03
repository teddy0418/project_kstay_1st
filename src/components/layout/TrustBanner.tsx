"use client";

import { useI18n } from "@/components/ui/LanguageProvider";
import Container from "@/components/layout/Container";

const COPY = {
  ko: {
    title: "KSTAY는 왜 다른 플랫폼보다 저렴하나요?",
    body: "KSTAY는 과도한 수수료를 줄여, 그 비용을 오롯이 호스트의 서비스 질 향상과 게스트의 가격 혜택으로 돌려드립니다.\n우리는 단순히 숙소를 파는 것이 아니라, 가장 한국적인 경험을 가장 정직한 가격에 연결하는 '신뢰 인프라'를 지향합니다.",
  },
  en: {
    title: "Why is KSTAY more affordable than other platforms?",
    body: "KSTAY cuts excessive fees, returning that value to hosts as better service and to guests as better prices.\nWe don't just list stays—we aim to be a trust layer that connects the most Korean experience with the most honest price.",
  },
  ja: {
    title: "KSTAYが他プラットフォームよりお得な理由",
    body: "KSTAYは過剰な手数料を抑え、その分をホストのサービス向上とゲストの価格メリットに還元しています。\n私たちは宿泊先を並べるだけでなく、最も韓国らしい体験を最も誠実な価格でつなぐ「信頼インフラ」を目指しています。",
  },
  zh: {
    title: "为什么 KSTAY 比其他平台更实惠？",
    body: "KSTAY 减少过高佣金，将节省下来的成本全部用于提升房东服务质量和房客价格优惠。\n我们不仅是在展示住宿，更致力于成为以最诚实的价格连接最地道韩国体验的「信任基础设施」。",
  },
} as const;

export default function TrustBanner() {
  const { lang } = useI18n();
  const c = COPY[lang] ?? COPY.en;

  return (
    <div className="border-b border-neutral-100 bg-gradient-to-r from-neutral-50 to-white">
      <Container className="py-[5px] sm:py-2 text-center">
        <p className="text-xs font-semibold leading-snug text-neutral-800">
          {c.title}
        </p>
        <p
          className="mt-0.5 whitespace-pre-line text-[11px] leading-snug text-neutral-600 mx-auto max-w-2xl sm:line-clamp-2"
          title={c.body}
        >
          {c.body}
        </p>
      </Container>
    </div>
  );
}
