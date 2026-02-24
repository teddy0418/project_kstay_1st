"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { signIn } from "next-auth/react";
import { apiClient } from "@/lib/api/client";

export default function HostListingsNewEntryPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [error, setError] = useState<string | null>(null);
  const started = useRef(false);

  useEffect(() => {
    if (status !== "authenticated" || !session?.user) return;
    const role = (session.user as { role?: string }).role;
    if (role !== "HOST" && role !== "ADMIN") {
      router.replace("/host/onboarding");
      return;
    }
    if (started.current) return;
    started.current = true;

    (async () => {
      setError(null);
      try {
        const statusRes = await apiClient.get<{ status: string; draftListingId?: string | null }>("/api/host/listings/status");
        const existingDraftId = statusRes?.draftListingId ?? null;
        if (existingDraftId) {
          router.replace(`/host/listings/new/${existingDraftId}/basics`);
          return;
        }
        const data = await apiClient.post<{ id: string }>("/api/host/listings", {
          title: "신규 숙소",
          titleKo: "신규 숙소",
          city: "Seoul",
          area: "Jongno",
          address: "주소를 입력해 주세요",
          basePriceKrw: 100000,
          checkInTime: "15:00",
          checkOutTime: "11:00",
          status: "DRAFT",
        });
        const id = data?.id;
        if (!id) throw new Error("No id");
        router.replace(`/host/listings/new/${id}/basics`);
      } catch (e) {
        setError(e instanceof Error ? e.message : "초안 생성 실패");
        if (typeof (e as { status?: number }).status === "number" && (e as { status: number }).status === 401) {
          await signIn();
        }
      }
    })();
  }, [router, session, status]);

  if (status === "loading") {
    return (
      <div className="mx-auto max-w-2xl p-8 text-center text-neutral-600">
        초안 생성 중…
      </div>
    );
  }

  if (status !== "authenticated" || !session?.user) {
    return (
      <div className="mx-auto max-w-2xl p-8 text-center">
        <p className="text-neutral-600">로그인한 뒤 새 숙소를 등록할 수 있습니다.</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-2xl p-8">
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-800">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl p-8 text-center text-neutral-600">
      초안 생성 중…
    </div>
  );
}
