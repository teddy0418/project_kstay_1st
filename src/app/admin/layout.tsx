import Link from "next/link";
import Container from "@/components/layout/Container";
import { getServerLang } from "@/lib/i18n/server";

const COPY = {
  en: { title: "KSTAY Admin", guest: "Guest", summary: "Summary", approvals: "Approvals", settlements: "Settlements" },
  ko: { title: "KSTAY 관리자", guest: "게스트", summary: "요약", approvals: "승인", settlements: "정산" },
  ja: { title: "KSTAY 管理", guest: "ゲスト", summary: "概要", approvals: "承認", settlements: "精算" },
  zh: { title: "KSTAY 管理", guest: "用户", summary: "概览", approvals: "审核", settlements: "结算" },
} as const;

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const lang = await getServerLang();
  const c = COPY[lang];
  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="border-b border-neutral-200 bg-white">
        <Container className="py-4 flex items-center justify-between">
          <div className="font-semibold">{c.title}</div>
          <div className="flex gap-3 text-sm">
            <Link href="/" className="text-neutral-600 hover:text-neutral-900">
              {c.guest}
            </Link>
            <Link href="/admin" className="text-neutral-600 hover:text-neutral-900">
              {c.summary}
            </Link>
            <Link href="/admin/approvals" className="text-neutral-600 hover:text-neutral-900">
              {c.approvals}
            </Link>
            <Link href="/admin/settlements" className="text-neutral-600 hover:text-neutral-900">
              {c.settlements}
            </Link>
          </div>
        </Container>
      </div>
      <Container className="py-8">{children}</Container>
    </div>
  );
}
