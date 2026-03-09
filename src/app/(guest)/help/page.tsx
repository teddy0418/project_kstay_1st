import { getServerLang } from "@/lib/i18n/server";

const COPY = {
  en: {
    title: "Help Center",
    subtitle: "Policies and FAQs for KSTAY guests.",
    cancellation: "Cancellation policy",
    cancellationBody:
      "Free cancellation is available until 5 days before check-in (Korea Time, KST). After that, cancellations may not be refundable.",
    pricing: "Pricing",
    pricingBody: "KSTAY shows the final price upfront (tax & service fee included) to avoid surprises at checkout.",
    contact: "Contact",
    contactBody: "For urgent issues, contact support via the support inbox (ticket-style messaging).",
    privacy: "Privacy & data deletion",
    privacyBody: "We collect and use your information as described in our Privacy Policy. To request deletion of your data, contact us at help@kstay.com or remove our app from your social account (e.g. Facebook: Settings > Apps and Websites).",
    privacyLink: "Full Privacy Policy",
  },
  ko: {
    title: "도움말 센터",
    subtitle: "KSTAY 게스트를 위한 정책 및 자주 묻는 질문입니다.",
    cancellation: "취소 정책",
    cancellationBody: "체크인 5일 전(한국시간 KST)까지는 무료 취소가 가능합니다. 이후 취소는 환불되지 않을 수 있습니다.",
    pricing: "요금 안내",
    pricingBody: "KSTAY는 체크아웃 단계의 깜짝 비용을 줄이기 위해 최종 결제금액(세금/서비스료 포함)을 미리 보여줍니다.",
    contact: "문의",
    contactBody: "긴급한 이슈는 고객센터 문의(게시판형 메시지)를 통해 문의해 주세요.",
    privacy: "개인정보 및 데이터 삭제",
    privacyBody: "수집·이용 내용은 개인정보처리방침을 참고해 주세요. 데이터 삭제를 원하시면 help@kstay.com으로 문의하거나, 소셜 계정(예: Facebook 설정 > 앱 및 웹사이트)에서 앱 제거를 요청해 주세요.",
    privacyLink: "전체 개인정보처리방침",
  },
  ja: {
    title: "ヘルプセンター",
    subtitle: "KSTAYゲスト向けのポリシーとFAQです。",
    cancellation: "キャンセルポリシー",
    cancellationBody: "チェックイン5日前（韓国標準時 KST）まで無料キャンセル可能です。それ以降は返金不可となる場合があります。",
    pricing: "料金",
    pricingBody: "KSTAYはチェックアウト時の想定外料金を防ぐため、最終料金（税・サービス料込み）を事前表示します。",
    contact: "お問い合わせ",
    contactBody: "緊急のお問い合わせはメッセージ機能（準備中）をご利用ください。",
    privacy: "プライバシー・データ削除",
    privacyBody: "収集・利用内容はプライバシーポリシーをご確認ください。データ削除をご希望の方は help@kstay.com までお問い合わせいただくか、ソーシャルアカウント（例: Facebook 設定 > アプリとウェブサイト）でアプリ削除をリクエストしてください。",
    privacyLink: "プライバシーポリシー全文",
  },
  zh: {
    title: "帮助中心",
    subtitle: "面向 KSTAY 客人的政策与常见问题。",
    cancellation: "取消政策",
    cancellationBody: "入住前 5 天（韩国时间 KST）可免费取消。此后取消可能无法退款。",
    pricing: "价格说明",
    pricingBody: "KSTAY 会提前展示最终价格（含税与服务费），避免结算时出现意外费用。",
    contact: "联系我们",
    contactBody: "紧急问题请通过消息功能联系支持（即将上线）。",
    privacy: "隐私与数据删除",
    privacyBody: "我们如何收集与使用您的信息请见隐私政策。如需请求删除数据，请发送邮件至 help@kstay.com 或在社交账号（如 Facebook 设置 > 应用和网站）中移除本应用。",
    privacyLink: "完整隐私政策",
  },
} as const;

export default async function HelpPage() {
  const lang = await getServerLang();
  const c = COPY[lang];
  return (
    <div className="bg-white">
      <div className="mx-auto w-full max-w-screen-xl px-4 py-10">
        <div className="text-3xl font-extrabold tracking-tight">{c.title}</div>
        <div className="mt-2 text-sm text-neutral-600">{c.subtitle}</div>

        <div className="mt-8 grid gap-4">
          <section className="rounded-3xl border border-neutral-200 bg-white shadow-sm p-6">
            <div className="text-lg font-bold">{c.cancellation}</div>
            <div className="mt-2 text-sm text-neutral-600 leading-6">{c.cancellationBody}</div>
          </section>

          <section className="rounded-3xl border border-neutral-200 bg-white shadow-sm p-6">
            <div className="text-lg font-bold">{c.pricing}</div>
            <div className="mt-2 text-sm text-neutral-600 leading-6">{c.pricingBody}</div>
          </section>

          <section className="rounded-3xl border border-neutral-200 bg-white shadow-sm p-6">
            <div className="text-lg font-bold">{c.contact}</div>
            <div className="mt-2 text-sm text-neutral-600 leading-6">{c.contactBody}</div>
            <p className="mt-3">
              <a href="/messages" className="font-medium text-neutral-800 underline hover:text-neutral-600">
                {lang === "ko" ? "고객센터 문의하기" : lang === "ja" ? "お問い合わせ" : lang === "zh" ? "聯絡客服" : "Contact support"}
              </a>
            </p>
          </section>

          <section id="privacy" className="rounded-3xl border border-neutral-200 bg-white shadow-sm p-6 scroll-mt-6">
            <div className="text-lg font-bold">{c.privacy}</div>
            <div className="mt-2 text-sm text-neutral-600 leading-6">{c.privacyBody}</div>
            <p className="mt-3">
              <a href="/privacy" className="font-medium text-neutral-800 underline hover:text-neutral-600">
                {c.privacyLink}
              </a>
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
