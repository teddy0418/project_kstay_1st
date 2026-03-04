"use client";

import Link from "next/link";
import Container from "@/components/layout/Container";
import { useI18n } from "@/components/ui/LanguageProvider";

const COMPANY = {
  name: "(주)케이스테이",
  address: "서울특별시 강남구 테헤란로 123, 4층",
  ceo: "대표이사 : 곽근형",
  bizNo: "000-00-00000",
  bizVerifyUrl: "https://www.nts.go.kr/nts/na/ntt/selectNttList.do", // 사업자정보확인
  email: "help@kstay.com",
  telecomSaleNo: "통신판매업 신고번호 : 제 0000-서울강남-00000호",
  tourismBizNo: "관광사업자 등록번호 : 제0000-00호",
  phone: "전화번호 : 0000-0000",
  hosting: "호스팅서비스제공자 : (주)케이스테이",
};

const DISCLAIMER_KO =
  "(주)케이스테이는 통신판매중개자로서 통신판매의 당사자가 아니며, 숙소 예약·이용 및 환불 등과 관련한 의무와 책임은 각 판매자(호스트)에게 있습니다.";

const POLICY_LINKS: Array<{
  href: string;
  labelKo: string;
  labelEn: string;
  labelJa: string;
  labelZh: string;
}> = [
  { href: "/terms", labelKo: "이용약관", labelEn: "Terms of Service", labelJa: "利用規約", labelZh: "服务条款" },
  { href: "/privacy", labelKo: "개인정보처리방침", labelEn: "Privacy Policy", labelJa: "プライバシーポリシー", labelZh: "隐私政策" },
  { href: "/help#dispute", labelKo: "소비자 분쟁해결 기준", labelEn: "Consumer Dispute Resolution", labelJa: "消費者紛争解決基準", labelZh: "消费者争议解决标准" },
  { href: "/help#contents", labelKo: "콘텐츠산업진흥법에 의한 표시", labelEn: "Contents Industry Promotion Act", labelJa: "コンテンツ産業振興法に基づく表示", labelZh: "内容产业促进法相关标示" },
];

export default function Footer() {
  const { lang } = useI18n();
  const labelByLang = (link: (typeof POLICY_LINKS)[0]) =>
    lang === "ko" ? link.labelKo : lang === "ja" ? link.labelJa : lang === "zh" ? link.labelZh : link.labelEn;

  return (
    <footer className="border-t border-neutral-200 bg-neutral-50 pt-6 pb-5 md:pt-8 md:pb-6">
      <Container className="text-[10px] text-neutral-600 md:text-[11px]">
        {/* 회사 정보 */}
        <div className="space-y-0.5">
          <p className="font-semibold text-neutral-800">{COMPANY.name}</p>
          <p>{COMPANY.address}</p>
          <p>{COMPANY.ceo}</p>
          <p>
            사업자등록번호: {COMPANY.bizNo}{" "}
            <a
              href={COMPANY.bizVerifyUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-neutral-900"
            >
              사업자정보확인
            </a>
          </p>
          <p>전자우편주소: {COMPANY.email}</p>
          <p>{COMPANY.telecomSaleNo}</p>
          <p>{COMPANY.tourismBizNo}</p>
          <p>{COMPANY.phone}</p>
          <p>{COMPANY.hosting}</p>
        </div>

        {/* 중개자 고지 */}
        <p className="mt-3 max-w-2xl leading-relaxed">{DISCLAIMER_KO}</p>

        {/* 정책 링크 (선택 언어에 맞게 표시) */}
        <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1">
          {POLICY_LINKS.map((link) => (
            <Link key={link.href} href={link.href} className="hover:text-neutral-900 underline">
              {labelByLang(link)}
            </Link>
          ))}
        </div>

        {/* 저작권 */}
        <p className="mt-4 text-neutral-500">Copyright © KSTAY. All rights reserved.</p>
      </Container>
    </footer>
  );
}
