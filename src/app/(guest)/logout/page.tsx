"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/ui/AuthProvider";

export default function LogoutRoute() {
  const router = useRouter();
  const { signOut } = useAuth();

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
      로그아웃 중...
    </div>
  );
}
