import Container from "@/components/layout/Container";
import { getServerLang } from "@/lib/i18n/server";

const COPY = {
  en: { title: "Messages", desc: "MVP placeholder." },
  ko: { title: "메시지", desc: "MVP 플레이스홀더입니다." },
  ja: { title: "メッセージ", desc: "MVPプレースホルダーです。" },
  zh: { title: "消息", desc: "MVP 占位页面。" },
} as const;

export default async function MessagesPage() {
  const lang = await getServerLang();
  const c = COPY[lang];
  return (
    <Container className="py-10">
      <h1 className="text-2xl font-semibold tracking-tight">{c.title}</h1>
      <p className="mt-2 text-sm text-neutral-600">{c.desc}</p>
    </Container>
  );
}
