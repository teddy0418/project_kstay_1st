"use client";

import { useRouter } from "next/navigation";
import { HOST_STATUS_COOKIE } from "@/lib/hostStatus";

function setCookie(name: string, value: string) {
  const maxAge = 60 * 60 * 24 * 365;
  document.cookie = `${name}=${encodeURIComponent(value)}; Max-Age=${maxAge}; Path=/; SameSite=Lax`;
}

export default function ApproveDemoButton() {
  const router = useRouter();

  return (
    <button
      type="button"
      onClick={() => {
        setCookie(HOST_STATUS_COOKIE, "APPROVED");
        router.push("/host/dashboard");
        router.refresh();
      }}
      className="rounded-2xl border border-neutral-200 bg-white px-5 py-3 text-sm font-semibold hover:bg-neutral-50 transition"
    >
      (데모) 승인 완료로 전환
    </button>
  );
}
