"use client";

import { useEffect } from "react";
import { signIn } from "next-auth/react";
import { useOptionalToast } from "@/components/ui/ToastProvider";

export default function SessionExpiredListener() {
  const toast = useOptionalToast();

  useEffect(() => {
    let fired = false;
    const handler = () => {
      if (fired) return;
      fired = true;
      toast?.toast("Session expired. Please sign in again.");
      setTimeout(() => signIn(), 2000);
    };
    window.addEventListener("kstay:session-expired", handler);
    return () => window.removeEventListener("kstay:session-expired", handler);
  }, [toast]);

  return null;
}
