"use client";

import { useEffect, useState } from "react";
import { useI18n } from "@/components/ui/LanguageProvider";
import { useToast } from "@/components/ui/ToastProvider";
import {
  isInApp,
  isAndroid,
  isIOS,
  saveReturnUrl,
  consumeReturnUrl,
  getAndroidIntentRedirectUrl,
} from "@/lib/in-app-browser";
import { X } from "lucide-react";

const STORAGE_KEY_DISMISSED = "kstay_inapp_ios_dismissed";

export default function InAppBrowserGate() {
  const { t } = useI18n();
  const toast = useToast();
  const [showIosModal, setShowIosModal] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    if (!isInApp()) {
      const saved = consumeReturnUrl();
      if (saved && window.location.pathname === "/" && new URL(saved).pathname !== "/") {
        window.location.replace(saved);
      }
      return;
    }

    const fullUrl = window.location.href;
    saveReturnUrl();

    if (isAndroid()) {
      const intentUrl = getAndroidIntentRedirectUrl(fullUrl);
      window.location.href = intentUrl;
      return;
    }

    if (isIOS()) {
      try {
        const dismissed = sessionStorage.getItem(STORAGE_KEY_DISMISSED);
        if (!dismissed) queueMicrotask(() => setShowIosModal(true));
      } catch {
        queueMicrotask(() => setShowIosModal(true));
      }
    }
  }, []);

  const handleDismiss = () => {
    try {
      sessionStorage.setItem(STORAGE_KEY_DISMISSED, "1");
    } catch {}
    setShowIosModal(false);
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast.toast(t("inapp_browser_copied"));
    } catch {}
  };

  if (!showIosModal) return null;

  return (
    <div
      className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center bg-black/60 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="inapp-browser-title"
    >
      <div className="w-full max-w-sm rounded-2xl bg-neutral-900 text-white shadow-xl">
        <div className="flex items-center justify-between border-b border-neutral-700 px-4 py-3">
          <h2 id="inapp-browser-title" className="text-base font-semibold">
            {t("inapp_browser_title")}
          </h2>
          <button
            type="button"
            onClick={handleDismiss}
            className="rounded-full p-1.5 text-neutral-400 hover:bg-neutral-700 hover:text-white transition"
            aria-label={t("close")}
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="px-4 py-4 text-sm leading-relaxed text-neutral-200">
          {t("inapp_browser_message")}
        </div>
        <div className="flex gap-2 border-t border-neutral-700 px-4 py-3">
          <button
            type="button"
            onClick={handleCopyLink}
            className="flex-1 rounded-xl border border-neutral-600 bg-transparent px-4 py-2.5 text-sm font-medium text-white hover:bg-neutral-800 transition"
          >
            {t("inapp_browser_copy_link")}
          </button>
          <button
            type="button"
            onClick={handleDismiss}
            className="flex-1 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-neutral-900 hover:bg-neutral-100 transition"
          >
            {t("close")}
          </button>
        </div>
      </div>
    </div>
  );
}
