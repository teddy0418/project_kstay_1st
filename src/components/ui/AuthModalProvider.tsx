"use client";

import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import { X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth, type UserRole } from "@/components/ui/AuthProvider";
import { useComingSoon } from "@/hooks/useComingSoon";
import { useOptionalToast } from "@/components/ui/ToastProvider";
import { useI18n } from "@/components/ui/LanguageProvider";

type OpenOpts = {
  next?: string;
  role?: UserRole;
};

type Ctx = {
  isOpen: boolean;
  open: (opts?: OpenOpts) => void;
  close: () => void;
};

const AuthModalContext = createContext<Ctx | null>(null);

export default function AuthModalProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [nextPath, setNextPath] = useState<string | undefined>(undefined);

  const open = (opts?: OpenOpts) => {
    setNextPath(opts?.next);
    setIsOpen(true);
  };

  const close = () => {
    setIsOpen(false);
    setNextPath(undefined);
  };

  const value = useMemo(() => ({ isOpen, open, close }), [isOpen]);

  return (
    <AuthModalContext.Provider value={value}>
      {children}
      <AuthModal isOpen={isOpen} onClose={close} nextPath={nextPath} />
    </AuthModalContext.Provider>
  );
}

export function useAuthModal() {
  const ctx = useContext(AuthModalContext);
  if (!ctx) throw new Error("useAuthModal must be used within <AuthModalProvider/>");
  return ctx;
}

function AuthModal({
  isOpen,
  onClose,
  nextPath,
}: {
  isOpen: boolean;
  onClose: () => void;
  nextPath?: string;
}) {
  const router = useRouter();
  const { signInWithGoogle, isAuthed } = useAuth();
  const comingSoon = useComingSoon();
  const toastApi = useOptionalToast();
  const { t } = useI18n();
  const panelRef = useRef<HTMLDivElement | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    const onDown = (e: MouseEvent) => {
      const target = e.target as Node;
      if (panelRef.current && !panelRef.current.contains(target)) onClose();
    };

    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onDown);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onDown);
    };
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!isOpen) {
      setIsSubmitting(false);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || !isAuthed || !nextPath) return;
    const safeNext = nextPath.startsWith("/") ? nextPath : "/";
    onClose();
    router.replace(safeNext);
    router.refresh();
  }, [isAuthed, isOpen, nextPath, onClose, router]);

  if (!isOpen) return null;

  const onGoogle = async () => {
    if (isSubmitting) return;
    const callbackUrl =
      nextPath && nextPath.startsWith("/")
        ? nextPath
        : `${window.location.pathname}${window.location.search || ""}`;

    setIsSubmitting(true);
    try {
      await signInWithGoogle(callbackUrl);
      onClose();
    } catch {
      if (toastApi) {
        toastApi.toast(t("login_failed"));
      } else {
        alert(t("login_failed"));
      }
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200]">
      <div className="absolute inset-0 bg-black/40" />

      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div
          ref={panelRef}
          className="w-full max-w-[560px] rounded-3xl bg-white shadow-xl border border-neutral-200
                     transition-all duration-200 ease-out opacity-100 translate-y-0"
        >
          <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full hover:bg-neutral-100 transition"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
            <div className="text-sm font-semibold">{t("login_modal_title")}</div>
            <div className="h-9 w-9" />
          </div>

          <div className="px-6 py-6">
            <div className="text-2xl font-extrabold tracking-tight">{t("login_modal_welcome")}</div>
            <div className="mt-2 text-sm text-neutral-500">
              {t("login_modal_desc")}
            </div>

            <div className="mt-6 grid gap-3">
              <button
                type="button"
                onClick={onGoogle}
                disabled={isSubmitting}
                className="w-full rounded-2xl bg-neutral-900 px-5 py-4 text-white text-sm font-semibold hover:opacity-95 transition disabled:opacity-60"
              >
                {isSubmitting ? t("signing_in") : t("continue_google")}
              </button>

              <button
                type="button"
                onClick={() => comingSoon({ message: t("email_login_soon") })}
                className="w-full rounded-2xl border border-neutral-200 bg-white px-5 py-4 text-sm font-semibold hover:bg-neutral-50 transition"
              >
                {t("continue_email")}
              </button>
            </div>

            <div className="mt-5 text-xs text-neutral-500 leading-5">
              {t("login_modal_terms")}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
