"use client";

import { useCallback } from "react";
import { useOptionalToast } from "@/components/ui/ToastProvider";

type Options = {
  message?: string;
};

export function useComingSoon() {
  const toastCtx = useOptionalToast();

  return useCallback((opts?: Options) => {
    const message = opts?.message ?? "준비중인 기능입니다. 곧 제공됩니다.";
    if (toastCtx?.toast) {
      toastCtx.toast(message);
      return;
    }
    alert(message);
  }, [toastCtx]);
}
