"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useI18n } from "@/components/ui/LanguageProvider";
import { apiClient, ApiClientError } from "@/lib/api/client";

const NATIONALITIES = [
  { value: "", labelKey: "onboarding_nationality" },
  { value: "KR", label: "대한민국" },
  { value: "JP", label: "日本" },
  { value: "CN", label: "中国" },
  { value: "US", label: "United States" },
  { value: "TW", label: "台灣" },
  { value: "HK", label: "香港" },
  { value: "SG", label: "Singapore" },
  { value: "TH", label: "Thailand" },
  { value: "OTHER", label: "기타" },
];

type Props = {
  open: boolean;
  onClose: () => void;
  onComplete: () => void;
  initialData: {
    name?: string;
    email?: string;
    phone?: string;
    nationality?: string;
  };
};

export default function OnboardingModal({ open, onClose, onComplete, initialData }: Props) {
  const { t, lang } = useI18n();
  const [entered, setEntered] = useState(false);
  const [name, setName] = useState(initialData.name ?? "");
  const [phone, setPhone] = useState(initialData.phone ?? "");
  const [nationality, setNationality] = useState(initialData.nationality ?? "");
  const [privacyConsent, setPrivacyConsent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setName(initialData.name ?? "");
    setPhone(initialData.phone ?? "");
    setNationality(initialData.nationality ?? "");
    setPrivacyConsent(false);
    setError(null);
    setEntered(false);
    const id = requestAnimationFrame(() => setEntered(true));
    return () => cancelAnimationFrame(id);
  }, [open, initialData.name, initialData.phone, initialData.nationality]);

  const nationalityOptions = useMemo(() => {
    const first = NATIONALITIES[0];
    const rest = NATIONALITIES.slice(1);
    return [
      { value: first.value, label: lang === "ko" ? "국적 선택" : lang === "ja" ? "国籍を選択" : lang === "zh" ? "选择国籍" : "Select nationality" },
      ...rest.map((n) => ({ value: n.value, label: n.label })),
    ];
  }, [lang]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const requireName = !initialData.name || !initialData.name.trim();
    const requireContact = !initialData.email;

    if (requireName && !name.trim()) {
      setError(t("onboarding_name_required"));
      return;
    }
    if (requireContact && !phone.trim()) {
      setError(t("onboarding_contact_required"));
      return;
    }

    if (!privacyConsent) {
      setError(t("onboarding_consent_required"));
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await apiClient.patch("/api/user/profile", {
        completeOnboarding: true,
        name: name.trim() || undefined,
        phone: phone.trim() || null,
        nationality: nationality.trim() || null,
        privacyConsent: true,
      });
      onComplete();
      onClose();
    } catch (err) {
      const msg = err instanceof ApiClientError ? err.message : "Failed to save";
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[115] flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className={cn(
          "absolute inset-0 bg-black/40 transition-all duration-200 ease-out",
          entered ? "opacity-100" : "opacity-0"
        )}
      />

      <div
        className={cn(
          "relative w-full max-w-md rounded-2xl border border-neutral-200 bg-white shadow-xl",
          "transition-all duration-200 ease-out overflow-hidden",
          entered ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
        )}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-neutral-200 px-4 py-3">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full hover:bg-neutral-100 transition"
            aria-label={t("close")}
          >
            <X className="h-5 w-5" />
          </button>
          <span className="text-sm font-semibold text-neutral-800">{t("onboarding_welcome")}</span>
          <div className="w-9" />
        </div>

        <form onSubmit={handleSubmit} className="px-4 py-5">
          <p className="text-sm text-neutral-600">{t("onboarding_subtitle")}</p>

          <div className="mt-4 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-neutral-500">{t("onboarding_name")}</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t("onboarding_name")}
                className="mt-1 w-full rounded-xl border border-neutral-200 px-3 py-2.5 text-sm outline-none focus:border-neutral-400"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-500">{t("onboarding_nationality")}</label>
              <select
                value={nationality}
                onChange={(e) => setNationality(e.target.value)}
                className="mt-1 w-full rounded-xl border border-neutral-200 px-3 py-2.5 text-sm outline-none focus:border-neutral-400 bg-white"
              >
                {nationalityOptions.map((opt) => (
                  <option key={opt.value || "empty"} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-500">{t("onboarding_contact")}</label>
              <div className="mt-1 text-sm text-neutral-500">{initialData.email || "—"}</div>
              <p className="mt-0.5 text-[11px] text-neutral-400">{t("onboarding_email")}</p>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder={t("onboarding_phone")}
                className="mt-2 w-full rounded-xl border border-neutral-200 px-3 py-2.5 text-sm outline-none focus:border-neutral-400"
              />
            </div>

            <div className="pt-2">
              <label className="flex cursor-pointer items-start gap-2">
                <input
                  type="checkbox"
                  checked={privacyConsent}
                  onChange={(e) => setPrivacyConsent(e.target.checked)}
                  className="mt-1 h-4 w-4 rounded border-neutral-300"
                />
                <span className="text-sm text-neutral-700">
                  {t("onboarding_privacy_label")}{" "}
                  <Link href="/help#privacy" target="_blank" rel="noopener noreferrer" className="font-medium text-neutral-900 underline">
                    [{t("onboarding_privacy_view")}]
                  </Link>
                </span>
              </label>
            </div>
          </div>

          {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

          <div className="mt-6 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-xl border border-neutral-200 px-4 py-3 text-sm font-semibold text-neutral-700 hover:bg-neutral-50 transition"
            >
              {t("close")}
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 rounded-xl bg-neutral-900 px-4 py-3 text-sm font-semibold text-white hover:opacity-95 transition disabled:opacity-50"
            >
              {submitting ? "..." : t("onboarding_submit")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
