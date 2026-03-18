"use client";

import { Suspense, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useAuth } from "@/components/ui/AuthProvider";
import { useAuthModal } from "@/components/ui/AuthModalProvider";
import { useI18n } from "@/components/ui/LanguageProvider";
import Container from "@/components/layout/Container";

const COPY = {
  en: { heading: "Sign in to continue", desc: "Please sign in to access this page." },
  ko: { heading: "로그인이 필요합니다", desc: "이 페이지에 접근하려면 로그인해 주세요." },
  ja: { heading: "ログインが必要です", desc: "このページにアクセスするにはログインしてください。" },
  zh: { heading: "需要登录", desc: "请登录以访问此页面。" },
} as const;

function LoginContent() {
  const sp = useSearchParams();
  const router = useRouter();
  const { isAuthed } = useAuth();
  const { open } = useAuthModal();
  const { lang } = useI18n();
  const next = sp.get("next") || "/";
  const c = COPY[lang];

  useEffect(() => {
    if (isAuthed) {
      router.replace(next);
      return;
    }
    open({ next, role: "GUEST" });
  }, [isAuthed, next, open, router]);

  return (
    <Container className="py-16 text-center">
      <h1 className="text-2xl font-semibold tracking-tight">{c.heading}</h1>
      <p className="mt-3 text-sm text-neutral-500">{c.desc}</p>
    </Container>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginContent />
    </Suspense>
  );
}
