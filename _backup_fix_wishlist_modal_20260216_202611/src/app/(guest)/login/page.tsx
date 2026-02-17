"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Container from "@/components/layout/Container";
import { useAuth } from "@/components/ui/AuthProvider";
import { useI18n } from "@/components/ui/LanguageProvider";

export default function LoginPage() {
  const { t } = useI18n();
  const { isAuthed, signInDemo } = useAuth();
  const router = useRouter();
  const sp = useSearchParams();
  const next = sp.get("next") || "/";

  useEffect(() => {
    if (isAuthed) router.replace(next);
  }, [isAuthed, next, router]);

  return (
    <Container className="py-10">
      <div className="max-w-[520px]">
        <h1 className="text-2xl font-extrabold tracking-tight">{t("login_signup")}</h1>
        <p className="mt-2 text-sm text-neutral-500">
          MVP 단계에서는 데모 로그인으로 위시리스트/예약 흐름을 먼저 검증합니다.
        </p>

        <div className="mt-6 rounded-3xl border border-neutral-200 bg-white shadow-sm p-6">
          <button
            type="button"
            onClick={() => {
              signInDemo();
              router.replace(next);
            }}
            className="w-full rounded-2xl bg-neutral-900 px-5 py-4 text-white text-sm font-semibold hover:opacity-95 transition"
          >
            Continue with Google (Demo)
          </button>

          <div className="mt-4 text-xs text-neutral-500">
            * 실제 Google OAuth는 다음 단계에서 연결합니다.
          </div>
        </div>
      </div>
    </Container>
  );
}
