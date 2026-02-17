"use client";

import Container from "@/components/layout/Container";
import { useI18n } from "@/components/ui/LanguageProvider";

const SUPPORT_EMAIL = "support@your-domain.com";

const content: Record<string, { intro: string; sections: Array<{ title: string; body: string[] }> }> = {
  en: {
    intro: "Find answers about cancellations, pricing, and how KSTAY works.",
    sections: [
      { title: "Cancellation & Refund Policy (KST)", body: ["Free cancellation until 7 days before check-in, 23:59 (Korea Time).", "From 6 days before check-in: non-refundable (MVP rule).", "All deadlines are calculated in KST to avoid timezone disputes."] },
      { title: "Host can decline within 24 hours", body: ["You pay instantly to secure the booking.", "If the host declines within 24 hours, the payment is automatically canceled/refunded."] },
      { title: "Pricing transparency", body: ["Guest service fee (+10%) is already included in the displayed nightly price.", "Host fee is 0% (Best Value)."] },
      { title: "Contact support", body: ["Email: " + SUPPORT_EMAIL, "For urgent issues, please include your booking ID (once available)."] },
    ],
  },
  ko: {
    intro: "취소/환불 규정, 가격 정책, 서비스 이용 방법을 확인하세요.",
    sections: [
      { title: "취소/환불 규정 (KST 기준)", body: ["체크인 7일 전 23:59(KST)까지 무료 취소 가능합니다.", "체크인 6일 전부터는 환불 불가(MVP 규정)입니다.", "모든 기준 시각은 한국시간(KST)으로 계산합니다."] },
      { title: "호스트 24시간 거절 가능", body: ["예약 확보를 위해 결제는 즉시 진행됩니다.", "호스트가 24시간 내 거절하면 자동으로 승인 취소/환불됩니다."] },
      { title: "가격 투명성", body: ["게스트 수수료(+10%)는 이미 가격에 포함되어 표시됩니다.", "호스트 수수료는 0%입니다(Best Value)."] },
      { title: "문의하기", body: ["이메일: " + SUPPORT_EMAIL, "긴급 문의 시 (추후) 예약번호를 함께 보내주세요."] },
    ],
  },
  ja: {
    intro: "キャンセル/返金、料金、KSTAYの仕組みについて確認できます。",
    sections: [
      { title: "キャンセル・返金ポリシー (KST基準)", body: ["チェックイン7日前の23:59(KST)まで無料キャンセル可能。", "チェックイン6日前以降は返金不可（MVP）。", "すべての期限は韓国時間(KST)で計算します。"] },
      { title: "ホストは24時間以内に拒否可能", body: ["予約確保のため支払いは即時に行われます。", "ホストが24時間以内に拒否した場合、自動で返金されます。"] },
      { title: "料金の透明性", body: ["ゲスト手数料(+10%)は表示価格に含まれています。", "ホスト手数料は0%です（Best Value）。"] },
      { title: "サポートへの連絡", body: ["Email: " + SUPPORT_EMAIL] },
    ],
  },
  zh: {
    intro: "这里可以查看取消/退款、价格说明以及KSTAY的使用方式。",
    sections: [
      { title: "取消与退款规则（以KST为准）", body: ["入住前7天23:59（KST）之前可免费取消。", "入住前6天起不可退款（MVP规则）。", "所有截止时间按韩国时间（KST）计算。"] },
      { title: "房东可在24小时内拒绝", body: ["为确保预订，付款会立即完成。", "若房东在24小时内拒绝，将自动取消/退款。"] },
      { title: "价格透明", body: ["客人服务费（+10%）已包含在展示价格中。", "房东手续费为0%（Best Value）。"] },
      { title: "联系支持", body: ["Email: " + SUPPORT_EMAIL] },
    ],
  },
};

export default function HelpPage() {
  const { t, lang } = useI18n();
  const c = content[lang] ?? content.en;

  return (
    <Container className="py-10">
      <h1 className="text-2xl font-semibold tracking-tight">{t("help_center")}</h1>
      <p className="mt-2 text-sm text-neutral-600">{c.intro}</p>
      <div className="mt-8 grid gap-6">
        {c.sections.map((s) => (
          <section key={s.title} className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold">{s.title}</h2>
            <ul className="mt-3 list-disc pl-5 text-sm text-neutral-700 space-y-2">
              {s.body.map((line, idx) => (
                <li key={idx} className="leading-6">{line}</li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </Container>
  );
}
