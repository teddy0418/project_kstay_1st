"use client";

import { useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuthModal } from "@/components/ui/AuthModalProvider";

export default function AuthPageClient() {
  const sp = useSearchParams();
  const router = useRouter();
  const { isOpen, open } = useAuthModal();
  const openedOnce = useRef(false);

  const next = (sp.get("next") || "/").startsWith("/") ? (sp.get("next") || "/") : "/";

  useEffect(() => {
    open({ next, role: "GUEST" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (isOpen) openedOnce.current = true;
    if (!isOpen && openedOnce.current) {
      router.push(next || "/");
    }
  }, [isOpen, next, router]);

  return <div className="min-h-[60vh]" />;
}
