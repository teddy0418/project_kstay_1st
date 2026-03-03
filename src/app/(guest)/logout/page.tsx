"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/ui/AuthProvider";
import { useI18n } from "@/components/ui/LanguageProvider";

export default function LogoutRoute() {
  const router = useRouter();
  const { signOut } = useAuth();
  const { t } = useI18n();

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      await signOut("/");
      if (cancelled) return;
      router.replace("/");
      router.refresh();
    })();
    return () => {
      cancelled = true;
    };
  }, [signOut, router]);

  return (
    <div className="flex min-h-[40vh] items-center justify-center text-sm text-neutral-500">
      {t("logging_out")}
    </div>
  );
}
