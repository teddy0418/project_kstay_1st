"use client";

import { useEffect, useState } from "react";

type Profile = {
  payoutBank: string | null;
  payoutAccount: string | null;
  payoutName: string | null;
};

export default function HostAccountClient() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState<Profile>({
    payoutBank: "",
    payoutAccount: "",
    payoutName: "",
  });

  useEffect(() => {
    fetch("/api/host/profile")
      .then((r) => r.json())
      .then((res) => {
        if (res.data) {
          const d = res.data;
          setForm({
            payoutBank: d.payoutBank ?? "",
            payoutAccount: d.payoutAccount ?? "",
            payoutName: d.payoutName ?? "",
          });
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const save = () => {
    setSaving(true);
    setSaved(false);
    fetch("/api/host/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        payoutBank: form.payoutBank || null,
        payoutAccount: form.payoutAccount || null,
        payoutName: form.payoutName || null,
      }),
    })
      .then((r) => r.json())
      .then(() => setSaved(true))
      .finally(() => setSaving(false));
  };

  if (loading) {
    return (
      <div className="rounded-2xl border border-neutral-200 bg-white p-4 text-center text-neutral-500 sm:p-8">
        불러오는 중...
      </div>
    );
  }

  return (
    <div className="grid gap-6">
      {/* 정산 계좌 */}
      <section className="rounded-2xl border border-neutral-200 bg-white p-4 sm:p-6">
        <h2 className="text-base font-bold text-neutral-900 md:text-lg">정산 계좌 설정</h2>
        <p className="mt-1 text-xs text-neutral-500 md:text-sm">
          정산 금액을 받을 은행 계좌를 등록하세요. 등록된 계좌로 출금됩니다.
        </p>
        <div className="mt-4 grid gap-4 sm:max-w-lg sm:grid-cols-1">
          <div>
            <label className="block text-sm font-medium text-neutral-700">은행명</label>
            <input
              type="text"
              value={form.payoutBank ?? ""}
              onChange={(e) => setForm((p) => ({ ...p, payoutBank: e.target.value }))}
              placeholder="예: 국민은행"
              className="mt-1 w-full rounded-xl border border-neutral-200 px-4 py-2.5 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700">계좌번호</label>
            <input
              type="text"
              value={form.payoutAccount ?? ""}
              onChange={(e) => setForm((p) => ({ ...p, payoutAccount: e.target.value }))}
              placeholder="하이픈 없이 숫자만"
              className="mt-1 w-full rounded-xl border border-neutral-200 px-4 py-2.5 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700">예금주명</label>
            <input
              type="text"
              value={form.payoutName ?? ""}
              onChange={(e) => setForm((p) => ({ ...p, payoutName: e.target.value }))}
              placeholder="계좌 소유자 이름"
              className="mt-1 w-full rounded-xl border border-neutral-200 px-4 py-2.5 text-sm"
            />
          </div>
        </div>
      </section>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={save}
          disabled={saving}
          className="rounded-xl bg-neutral-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-neutral-800 disabled:opacity-50"
        >
          {saving ? "저장 중..." : "저장하기"}
        </button>
        {saved && <span className="text-sm text-emerald-600">저장되었습니다.</span>}
      </div>
    </div>
  );
}
