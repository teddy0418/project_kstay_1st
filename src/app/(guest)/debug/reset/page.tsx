"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function DebugResetPage() {
  const router = useRouter();

  useEffect(() => {
    try {
      for (let i = localStorage.length - 1; i >= 0; i--) {
        const k = localStorage.key(i);
        if (!k) continue;
        if (
          k.startsWith("kstay_") ||
          k.startsWith("kstay.") ||
          k.startsWith("kst_") ||
          k.startsWith("kstay_wishlist:")
        ) {
          localStorage.removeItem(k);
        }
      }
    } catch {}

    const cookiesToClear = [
      "kstay_user",
      "kstay_logged_in",
      "kstay_session",
      "kst_user",
      "kst_logged_in",
      "kstay_host_has_listing",
    ];
    cookiesToClear.forEach((name) => {
      document.cookie = `${name}=; Max-Age=0; Path=/; SameSite=Lax`;
    });

    router.replace("/");
  }, [router]);

  return null;
}
