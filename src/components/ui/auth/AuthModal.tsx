"use client";

import { useEffect, useMemo, useState } from "react";
import { X, Mail, Chrome } from "lucide-react";
import type { Role } from "@/lib/auth/session";
import { cn } from "@/lib/utils";
import { useI18n } from "@/components/ui/LanguageProvider";

export default function AuthModal({
  open,
  next,
  role,
  onClose,
}: {
  open: boolean;
  next: string;
  role: Role;
  onClose: () => void;
}) {
  const { t } = useI18n();
  const [entered, setEntered] = useState(false);
  const [mode, setMode] = useState<"main" | "email">("main");
  const [email, setEmail] = useState("");

  useEffect(() => {
    if (!open) {
      queueMicrotask(() => {
        setEntered(false);
        setMode("main");
      });
      return;
    }
    queueMicrotask(() => setEntered(false));
    const id = requestAnimationFrame(() => setEntered(true));
    return () => cancelAnimationFrame(id);
  }, [open]);

  const safeNext = useMemo(() => (next && next.startsWith("/") ? next : "/"), [next]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
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
          "relative w-full max-w-screen-sm rounded-2xl border border-neutral-200 bg-white shadow-xl mx-4",
          "transition-all duration-200 ease-out",
          entered ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
        )}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-neutral-200 px-5 py-4">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full hover:bg-neutral-100 transition"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
          <div className="text-sm font-semibold">{t("login_title")}</div>
          <div className="w-9" />
        </div>

        <div className="px-6 py-6">
          <div className="text-2xl font-semibold tracking-tight">{t("welcome_kstay")}</div>

          <div className="mt-6">
            {mode === "main" && (
              <div className="grid gap-3">
                <form action="/auth/login" method="post">
                  <input type="hidden" name="next" value={safeNext} />
                  <input type="hidden" name="role" value={role} />
                  <button
                    type="submit"
                    className="w-full rounded-xl border border-neutral-300 bg-white px-4 py-3 text-sm font-semibold hover:bg-neutral-50 transition inline-flex items-center justify-center gap-3"
                  >
                    <Chrome className="h-5 w-5" />
                    {t("continue_google")}
                  </button>
                </form>

                <button
                  type="button"
                  onClick={() => setMode("email")}
                  className="w-full rounded-xl border border-neutral-300 bg-white px-4 py-3 text-sm font-semibold hover:bg-neutral-50 transition inline-flex items-center justify-center gap-3"
                >
                  <Mail className="h-5 w-5" />
                  {t("continue_email")}
                </button>

                <div className="mt-2 text-xs text-neutral-500 leading-5">
                  MVP: 구글 로그인 버튼이 세션을 생성합니다. 실제 Google OAuth는 다음 단계에서 연결합니다.
                </div>
              </div>
            )}

            {mode === "email" && (
              <div className="grid gap-3">
                <div className="rounded-xl border border-neutral-200 px-3 py-2">
                  <label className="text-xs font-semibold text-neutral-500">Email</label>
                  <input
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={t("email_placeholder")}
                    className="mt-1 w-full text-sm outline-none"
                  />
                </div>

                <form action="/auth/login" method="post" className="grid gap-3">
                  <input type="hidden" name="next" value={safeNext} />
                  <input type="hidden" name="role" value={role} />
                  <button
                    type="submit"
                    className="w-full rounded-xl bg-neutral-900 px-4 py-3 text-sm font-semibold text-white hover:opacity-95 transition"
                  >
                    {t("continue")}
                  </button>
                </form>

                <button
                  type="button"
                  onClick={() => setMode("main")}
                  className="w-full rounded-xl border border-neutral-300 bg-white px-4 py-3 text-sm font-semibold hover:bg-neutral-50 transition"
                >
                  Back
                </button>

                <div className="text-xs text-neutral-500 leading-5">
                  이메일 회원가입은 MVP로 UI만 준비. DB 저장은 Prisma 단계에서 연결합니다.
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
