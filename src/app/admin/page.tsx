import Link from "next/link";
import { getServerLang } from "@/lib/i18n/server";

const COPY = {
  en: {
    title: "Control tower (MVP)",
    desc: "Settlement status + Excel download + pg_tid / settlement_id columns. Next phase.",
    go: "Go to host approvals",
  },
  ko: {
    title: "컨트롤 타워 (MVP)",
    desc: "정산 상태 + 엑셀 다운로드 + pg_tid / settlement_id 컬럼은 다음 단계에서 제공합니다.",
    go: "호스트 승인 화면으로 이동",
  },
  ja: {
    title: "コントロールタワー (MVP)",
    desc: "精算ステータス + Excel ダウンロード + pg_tid / settlement_id 列は次フェーズで対応します。",
    go: "ホスト承認へ移動",
  },
  zh: {
    title: "控制台（MVP）",
    desc: "结算状态、Excel 下载以及 pg_tid / settlement_id 列将在下一阶段提供。",
    go: "前往房东审核",
  },
} as const;

export default async function AdminPage() {
  const lang = await getServerLang();
  const c = COPY[lang];
  return (
    <div className="grid gap-6">
      <div className="rounded-2xl border border-neutral-200 bg-white p-6">
        <div className="text-sm font-semibold">{c.title}</div>
        <p className="mt-2 text-sm text-neutral-600">{c.desc}</p>
        <div className="mt-4">
          <Link href="/admin/approvals" className="text-sm font-semibold hover:underline">
            {c.go}
          </Link>
        </div>
      </div>
    </div>
  );
}
