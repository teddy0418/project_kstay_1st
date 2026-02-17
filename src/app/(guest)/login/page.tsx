"use client";

import { Suspense, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useAuthModal } from "@/components/ui/AuthModalProvider";

function LoginContent() {
  const sp = useSearchParams();
  const router = useRouter();
  const { open } = useAuthModal();
  const next = sp.get("next") || "/";

  useEffect(() => {
    open({ next, role: "GUEST" });
    router.replace(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginContent />
    </Suspense>
  );
}
