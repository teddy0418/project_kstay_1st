"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/ui/AuthProvider";

export default function LogoutRoute() {
  const router = useRouter();
  const { signOut } = useAuth();

  useEffect(() => {
    void (async () => {
      await signOut("/");
      router.replace("/");
      router.refresh();
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}
