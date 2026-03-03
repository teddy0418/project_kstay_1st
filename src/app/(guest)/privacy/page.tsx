import Link from "next/link";
import { getServerLang } from "@/lib/i18n/server";

const COPY = {
  en: {
    title: "Privacy Policy",
    subtitle: "Last updated: March 2025. KSTAY collects and uses your information as described below.",
    sectionCollect: "Information we collect",
    collectBody:
      "When you sign in with Google, LINE, Facebook, or Kakao, we receive your name, profile photo, and email (if provided by the provider). We store this in our systems to identify your account and display your profile. When you complete onboarding or update your profile, we may store your phone number and nationality. When you make a booking, we store reservation details, payment information (processed by our payment provider), and any message you send to the host.",
    sectionUse: "How we use your information",
    useBody:
      "We use your information to operate the service (e.g., managing your account, bookings, wishlist, and reviews), to communicate with you about your reservations, and to improve our platform. We do not sell your personal information to third parties.",
    sectionDeletion: "Data deletion and your rights",
    deletionBody:
      "You may request deletion of your personal data at any time. To do so, please contact us at the email below with the subject \"Data deletion request\" and we will process your request in accordance with our policy and applicable law. If you signed in with Facebook, you can also remove our app and request data deletion from your Facebook settings (Settings & Privacy > Settings > Apps and Websites); we will then receive a deletion request and process it.",
    deletionStatusUrl: "You can check the status of a deletion request by contacting us or visiting our Help Center.",
    contactLabel: "Contact",
    contactValue: "help@kstay.com",
    helpCenter: "Help Center",
  },
  ko: {
    title: "개인정보처리방침",
    subtitle: "최종 업데이트: 2025년 3월. KSTAY는 아래와 같이 정보를 수집·이용합니다.",
    sectionCollect: "수집하는 정보",
    collectBody:
      "Google, LINE, Facebook, 카카오로 로그인할 때 이름, 프로필 사진, 이메일(제공 시)을 받아 계정 식별 및 프로필 표시에 사용합니다. 온보딩 또는 프로필 수정 시 전화번호, 국적을 저장할 수 있습니다. 예약 시 예약 내용, 결제 정보(결제 대행사 처리), 호스트에게 보낸 메시지를 저장합니다.",
    sectionUse: "이용 목적",
    useBody:
      "서비스 운영(계정·예약·위시리스트·리뷰 관리), 예약 관련 안내, 서비스 개선에 사용합니다. 개인정보를 제3자에게 판매하지 않습니다.",
    sectionDeletion: "데이터 삭제 및 권리",
    deletionBody:
      "언제든 개인 데이터 삭제를 요청할 수 있습니다. 아래 연락처로 \"데이터 삭제 요청\" 제목으로 문의해 주시면 정책 및 관련 법에 따라 처리합니다. Facebook으로 로그인한 경우, Facebook 설정(설정 및 개인정보 > 앱 및 웹사이트)에서 앱 제거 및 데이터 삭제 요청을 하시면 저희가 삭제 요청을 수신해 처리합니다.",
    deletionStatusUrl: "삭제 요청 상태는 문의하시거나 도움말 센터에서 확인하실 수 있습니다.",
    contactLabel: "문의",
    contactValue: "help@kstay.com",
    helpCenter: "도움말 센터",
  },
  ja: {
    title: "プライバシーポリシー",
    subtitle: "最終更新: 2025年3月。KSTAYは以下のとおり情報を収集・利用します。",
    sectionCollect: "収集する情報",
    collectBody:
      "Google、LINE、Facebook、Kakaoでログインする際、名前・プロフィール写真・メール（提供時）を受け取り、アカウント識別とプロフィール表示に使用します。オンボーディングやプロフィール更新時に電話番号・国籍を保存することがあります。予約時に予約内容・決済情報（決済代行会社で処理）・ホストへのメッセージを保存します。",
    sectionUse: "利用目的",
    useBody:
      "サービス運営（アカウント・予約・ウィッシュリスト・レビュー管理）、予約に関する連絡、サービス改善に利用します。個人情報を第三者に販売しません。",
    sectionDeletion: "データ削除とお客様の権利",
    deletionBody:
      "いつでも個人データの削除を請求できます。下記連絡先に「データ削除請求」の件名でご連絡ください。当方のポリシーおよび適用法令に従って対応します。Facebookでログインした場合は、Facebookの設定（設定とプライバシー > アプリとウェブサイト）でアプリを削除しデータ削除を請求すると、当方に削除リクエストが届き処理します。",
    deletionStatusUrl: "削除リクエストの状況はお問い合わせまたはヘルプセンターで確認できます。",
    contactLabel: "お問い合わせ",
    contactValue: "help@kstay.com",
    helpCenter: "ヘルプセンター",
  },
  zh: {
    title: "隐私政策",
    subtitle: "最后更新：2025年3月。KSTAY 按以下说明收集与使用您的信息。",
    sectionCollect: "我们收集的信息",
    collectBody:
      "当您使用 Google、LINE、Facebook 或 Kakao 登录时，我们会收到您的姓名、头像及邮箱（若提供）。我们使用这些信息识别您的账户并展示您的资料。完成 onboarding 或更新资料时，我们可能会保存您的电话号码和国籍。预订时我们会保存预订详情、支付信息（由支付服务商处理）以及您发给房东的留言。",
    sectionUse: "信息使用方式",
    useBody:
      "我们使用您的信息以运营服务（如管理账户、预订、心愿单与评价）、就预订与您沟通，以及改进平台。我们不会向第三方出售您的个人信息。",
    sectionDeletion: "数据删除与您的权利",
    deletionBody:
      "您可随时请求删除您的个人数据。请通过下方邮箱联系我们，主题注明「数据删除请求」，我们将按本政策及适用法律处理。若您通过 Facebook 登录，也可在 Facebook 设置（设置与隐私 > 应用和网站）中移除本应用并请求删除数据，我们将收到删除请求并予以处理。",
    deletionStatusUrl: "您可通过联系我们或访问帮助中心查看删除请求的处理状态。",
    contactLabel: "联系我们",
    contactValue: "help@kstay.com",
    helpCenter: "帮助中心",
  },
} as const;

export default async function PrivacyPage() {
  const lang = await getServerLang();
  const c = COPY[lang];
  return (
    <div className="bg-white">
      <div className="mx-auto w-full max-w-screen-xl px-4 py-10">
        <div className="text-3xl font-extrabold tracking-tight">{c.title}</div>
        <div className="mt-2 text-sm text-neutral-600">{c.subtitle}</div>

        <div className="mt-8 grid gap-4">
          <section className="rounded-3xl border border-neutral-200 bg-white shadow-sm p-6">
            <div className="text-lg font-bold">{c.sectionCollect}</div>
            <div className="mt-2 text-sm text-neutral-600 leading-6 whitespace-pre-line">{c.collectBody}</div>
          </section>

          <section className="rounded-3xl border border-neutral-200 bg-white shadow-sm p-6">
            <div className="text-lg font-bold">{c.sectionUse}</div>
            <div className="mt-2 text-sm text-neutral-600 leading-6 whitespace-pre-line">{c.useBody}</div>
          </section>

          <section id="privacy" className="rounded-3xl border border-neutral-200 bg-white shadow-sm p-6 scroll-mt-6">
            <div className="text-lg font-bold">{c.sectionDeletion}</div>
            <div className="mt-2 text-sm text-neutral-600 leading-6 whitespace-pre-line">{c.deletionBody}</div>
            <div className="mt-3 text-sm text-neutral-600 leading-6">{c.deletionStatusUrl}</div>
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
