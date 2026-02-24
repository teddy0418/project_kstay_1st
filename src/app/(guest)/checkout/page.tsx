import Container from "@/components/layout/Container";
import { redirect } from "next/navigation";
import { diffNights, addDays } from "@/lib/format";
import { calcGuestServiceFeeKRW } from "@/lib/policy";
import { getPublicListingById } from "@/lib/repositories/listings";
import CheckoutPaymentCard from "./CheckoutPaymentCard";
import CheckoutPriceDisplay from "./CheckoutPriceDisplay";
import { getServerLang } from "@/lib/i18n/server";

const COPY = {
  en: {
    title: "Checkout",
    subtitle: "Pay now and booking is finalized only after server-side payment verification.",
    dates: "Dates",
    selectDates: "Select dates",
    guests: "Guests",
    base: "Base",
    fee: "Guest service fee (12%)",
    total: "Total",
    included: "Tax & Service Fee Included",
  },
  ko: {
    title: "결제",
    subtitle: "지금 결제해도 서버 결제 검증이 완료된 뒤에만 예약이 확정됩니다.",
    dates: "일정",
    selectDates: "일정을 선택하세요",
    guests: "인원",
    base: "기본 요금",
    fee: "게스트 서비스 수수료 (12%)",
    total: "합계",
    included: "세금 및 서비스 요금 포함",
  },
  ja: {
    title: "チェックアウト",
    subtitle: "今すぐ支払っても、サーバー側の決済検証完了後にのみ予約が確定します。",
    dates: "日程",
    selectDates: "日程を選択",
    guests: "人数",
    base: "基本料金",
    fee: "ゲストサービス料 (12%)",
    total: "合計",
    included: "税・サービス料込み",
  },
  zh: {
    title: "结算",
    subtitle: "立即支付后，只有在服务端完成支付校验后才会确认预订。",
    dates: "日期",
    selectDates: "请选择日期",
    guests: "人数",
    base: "基础费用",
    fee: "客人服务费 (12%)",
    total: "总计",
    included: "已含税费与服务费",
  },
} as const;

function safeStr(v: unknown): string {
  if (typeof v === "string") return v;
  if (Array.isArray(v) && v.length > 0 && typeof v[0] === "string") return v[0];
  return "";
}

function safeInt(v: unknown, fallback = 1) {
  if (typeof v !== "string") return fallback;
  const n = Number.parseInt(v, 10);
  return Number.isFinite(n) ? n : fallback;
}

export default async function CheckoutPage({
  searchParams,
}: {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const lang = await getServerLang();
  const c = COPY[lang];
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const listingId = safeStr(resolvedSearchParams?.listingId);
  let start = safeStr(resolvedSearchParams?.start);
  let end = safeStr(resolvedSearchParams?.end);
  const guests = safeInt(resolvedSearchParams?.guests, 1);

  // 날짜 없이 진입 시 기본값 (오늘~내일) - 테스트 편의
  if (!start || !end) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = addDays(today, 1);
    const y = (d: Date) => d.getFullYear();
    const m = (d: Date) => String(d.getMonth() + 1).padStart(2, "0");
    const day = (d: Date) => String(d.getDate()).padStart(2, "0");
    start = start || `${y(today)}-${m(today)}-${day(today)}`;
    end = end || `${y(tomorrow)}-${m(tomorrow)}-${day(tomorrow)}`;
  }

  const listing = await getPublicListingById(listingId);
  if (!listing) redirect("/coming-soon");

  const nights = diffNights(start, end);
  const baseTotal = listing.pricePerNightKRW * Math.max(1, nights);
  const fee = calcGuestServiceFeeKRW(baseTotal);
  const total = baseTotal + fee;

  return (
    <Container className="py-10">
      <h1 className="text-2xl font-semibold tracking-tight">{c.title}</h1>
      <p className="mt-2 text-sm text-neutral-600">{c.subtitle}</p>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_380px]">
        <section className="rounded-2xl border border-neutral-200 p-6">
          <div className="text-sm font-semibold">{listing.title}</div>
          <div className="mt-2 text-sm text-neutral-600">
            {c.dates}: {start && end ? `${start} → ${end}` : c.selectDates} · {c.guests}: {guests}
          </div>

          <CheckoutPriceDisplay baseTotal={baseTotal} fee={fee} total={total} copy={c} />
        </section>

        <CheckoutPaymentCard listingId={listingId} checkIn={start} checkOut={end} guests={guests} />
      </div>
    </Container>
  );
}
