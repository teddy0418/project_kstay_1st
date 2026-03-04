import Link from "next/link";
import { getServerLang } from "@/lib/i18n/server";

const COPY = {
  en: {
    title: "Terms of Service",
    subtitle: "Last updated: March 2025. By using KSTAY, you agree to these terms.",
    section1: "1. Acceptance of Terms",
    body1:
      "By accessing or using the KSTAY platform (the \"Service\"), you agree to be bound by these Terms of Service. If you do not agree, please do not use the Service.",
    section2: "2. Description of Service",
    body2:
      "KSTAY is an intermediary platform that connects guests with accommodation hosts. We do not own, manage, or control the accommodations listed. Reservations and related obligations are between you and the host.",
    section3: "3. User Accounts",
    body3:
      "You must provide accurate information when creating an account. You are responsible for maintaining the confidentiality of your account and for all activities under your account.",
    section4: "4. Bookings and Payments",
    body4:
      "When you make a booking, you agree to pay the total amount shown, including any applicable fees. Cancellation and refund policies are as stated at the time of booking and in our Help Center.",
    section5: "5. Prohibited Conduct",
    body5:
      "You may not use the Service for any illegal purpose, to harm others, or to violate these terms. We may suspend or terminate your access if we believe you have violated these terms.",
    contactLabel: "Contact",
    contactValue: "help@kstay.com",
    helpCenter: "Help Center",
  },
  ko: {
    title: "이용약관",
    subtitle: "최종 업데이트: 2025년 3월. KSTAY 서비스를 이용하시면 본 약관에 동의하는 것으로 봅니다.",
    section1: "제1조 (약관의 동의)",
    body1:
      "KSTAY 플랫폼(이하 \"서비스\")에 접속하거나 이용함으로써 본 이용약관에 구속되는 것에 동의합니다. 동의하지 않으시면 서비스를 이용하실 수 없습니다.",
    section2: "제2조 (서비스의 내용)",
    body2:
      "KSTAY는 게스트와 숙소 호스트를 연결하는 중개 플랫폼입니다. 당사는 게시된 숙소를 소유·관리·통제하지 않습니다. 예약 및 관련 의무는 이용자와 호스트 간에 성립합니다.",
    section3: "제3조 (회원 계정)",
    body3:
      "계정 생성 시 정확한 정보를 제공해야 합니다. 계정 비밀번호의 비밀 유지 및 계정 하의 모든 활동에 대한 책임은 이용자에게 있습니다.",
    section4: "제4조 (예약 및 결제)",
    body4:
      "예약 시 표시된 총 금액 및 적용 수수료를 결제하는 것에 동의합니다. 취소 및 환불 정책은 예약 시점 및 도움말 센터에 안내된 내용을 따릅니다.",
    section5: "제5조 (금지 행위)",
    body5:
      "서비스를 불법 목적, 타인에게 피해를 주거나 본 약관을 위반하는 용도로 이용할 수 없습니다. 위반이 있다고 판단될 경우 이용을 제한하거나 종료할 수 있습니다.",
    contactLabel: "문의",
    contactValue: "help@kstay.com",
    helpCenter: "도움말 센터",
  },
  ja: {
    title: "利用規約",
    subtitle: "最終更新: 2025年3月。KSTAYをご利用いただくことで、本規約に同意したものとみなします。",
    section1: "第1条（規約への同意）",
    body1:
      "KSTAYプラットフォーム（以下「サービス」）にアクセスまたは利用することにより、本利用規約に拘束されることに同意したものとみなします。同意されない場合はご利用いただけません。",
    section2: "第2条（サービスの内容）",
    body2:
      "KSTAYはゲストと宿泊施設のホストを結ぶ仲介プラットフォームです。当社は掲載施設を所有・管理・運営していません。予約および関連する義務はお客様とホストの間で成立します。",
    section3: "第3条（アカウント）",
    body3:
      "アカウント作成時には正確な情報を提供してください。アカウントの管理およびアカウント下でのすべての行為について、お客様に責任があります。",
    section4: "第4条（予約と支払い）",
    body4:
      "予約を行う際、表示された合計金額および適用される手数料をお支払いいただくことに同意したものとみなします。キャンセル・返金は予約時およびヘルプセンターに記載のポリシーに従います。",
    section5: "第5条（禁止行為）",
    body5:
      "サービスを違法な目的、他者への害、または本規約違反に用いることはできません。違反があると判断した場合、利用を制限または終了することがあります。",
    contactLabel: "お問い合わせ",
    contactValue: "help@kstay.com",
    helpCenter: "ヘルプセンター",
  },
  zh: {
    title: "服务条款",
    subtitle: "最后更新：2025年3月。使用 KSTAY 即表示您同意本条款。",
    section1: "第1条 接受条款",
    body1:
      "访问或使用 KSTAY 平台（以下简称「服务」）即表示您同意受本服务条款约束。若不同意，请勿使用本服务。",
    section2: "第2条 服务说明",
    body2:
      "KSTAY 为连接房客与住宿房东的中介平台。我们并不拥有、管理或控制所刊登的住宿。预订及相关义务存在于您与房东之间。",
    section3: "第3条 用户账户",
    body3:
      "创建账户时须提供真实信息。您须对账户保密及账户下的一切行为负责。",
    section4: "第4条 预订与支付",
    body4:
      "进行预订即表示您同意支付所显示的总金额及适用费用。取消与退款政策以预订时及帮助中心所载为准。",
    section5: "第5条 禁止行为",
    body5:
      "不得将服务用于任何非法目的、损害他人或违反本条款。若我们认定您存在违规，可暂停或终止您的访问。",
    contactLabel: "联系我们",
    contactValue: "help@kstay.com",
    helpCenter: "帮助中心",
  },
} as const;

export default async function TermsPage() {
  const lang = await getServerLang();
  const c = COPY[lang];
  return (
    <div className="bg-white">
      <div className="mx-auto w-full max-w-screen-xl px-4 py-10">
        <div className="text-3xl font-extrabold tracking-tight">{c.title}</div>
        <div className="mt-2 text-sm text-neutral-600">{c.subtitle}</div>

        <div className="mt-8 grid gap-4">
          <section className="rounded-3xl border border-neutral-200 bg-white shadow-sm p-6">
            <div className="text-lg font-bold">{c.section1}</div>
            <div className="mt-2 text-sm text-neutral-600 leading-6 whitespace-pre-line">{c.body1}</div>
          </section>

          <section className="rounded-3xl border border-neutral-200 bg-white shadow-sm p-6">
            <div className="text-lg font-bold">{c.section2}</div>
            <div className="mt-2 text-sm text-neutral-600 leading-6 whitespace-pre-line">{c.body2}</div>
          </section>

          <section className="rounded-3xl border border-neutral-200 bg-white shadow-sm p-6">
            <div className="text-lg font-bold">{c.section3}</div>
            <div className="mt-2 text-sm text-neutral-600 leading-6 whitespace-pre-line">{c.body3}</div>
          </section>

          <section className="rounded-3xl border border-neutral-200 bg-white shadow-sm p-6">
            <div className="text-lg font-bold">{c.section4}</div>
            <div className="mt-2 text-sm text-neutral-600 leading-6 whitespace-pre-line">{c.body4}</div>
          </section>

          <section className="rounded-3xl border border-neutral-200 bg-white shadow-sm p-6">
            <div className="text-lg font-bold">{c.section5}</div>
            <div className="mt-2 text-sm text-neutral-600 leading-6 whitespace-pre-line">{c.body5}</div>
          </section>

          <section className="rounded-3xl border border-neutral-200 bg-white shadow-sm p-6">
            <div className="text-lg font-bold">{c.contactLabel}</div>
            <div className="mt-2 text-sm text-neutral-600">
              <a href={`mailto:${c.contactValue}`} className="underline hover:text-neutral-900">
                {c.contactValue}
              </a>
            </div>
          </section>
        </div>

        <p className="mt-6">
          <Link href="/help" className="text-sm font-medium text-neutral-700 underline hover:text-neutral-900">
            ← {c.helpCenter}
          </Link>
        </p>
      </div>
    </div>
  );
}
