"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useI18n } from "@/components/ui/LanguageProvider";
import { apiClient } from "@/lib/api/client";

type Thread = {
  bookingId: string;
  listingTitle: string;
  checkIn: string;
  checkOut: string;
  nights: number;
  lastMessageAt: string | null;
  lastBodyPreview: string | null;
  unreadCount: number;
};

function formatTimestamp(value: string | null) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString();
}

export default function HostMessagesInboxClient() {
  const { t } = useI18n();
  const [threads, setThreads] = useState<Thread[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchThreads = useCallback(async () => {
    const res = await apiClient
      .get<{ threads?: Thread[]; role?: string }>("/api/messages/bookings")
      .catch(() => ({ threads: [] }));
    setThreads(Array.isArray(res.threads) ? res.threads : []);
  }, []);

  useEffect(() => {
    setLoading(true);
    fetchThreads().finally(() => setLoading(false));
  }, [fetchThreads]);

  if (loading) {
    return (
      <div className="rounded-2xl border border-neutral-200 bg-white shadow-sm p-6">
        <p className="text-neutral-500">{t("loading")}</p>
      </div>
    );
  }

  if (threads.length === 0) {
    return (
      <div className="rounded-2xl border border-neutral-200 bg-white shadow-sm p-6">
        <h1 className="text-xl font-extrabold tracking-tight md:text-2xl">{t("messages_inbox")}</h1>
        <p className="mt-2 text-sm text-neutral-600">예약된 숙소가 없거나 아직 대화가 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-neutral-200 bg-white shadow-sm overflow-hidden">
      <div className="border-b border-neutral-100 p-4 sm:p-6">
        <h1 className="text-xl font-extrabold tracking-tight md:text-2xl">{t("messages_inbox")}</h1>
        <p className="mt-2 text-xs text-neutral-500 md:text-sm">{t("messages_with_host")}</p>
      </div>

      <ul className="divide-y divide-neutral-100">
        {threads.map((th) => (
          <li key={th.bookingId}>
            <Link
              href={`/host/messages/booking/${th.bookingId}`}
              className="block p-4 sm:p-6 hover:bg-neutral-50 transition"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="font-semibold text-neutral-900 truncate">
                    {t("messages_with_host")}
                  </div>
                  <div className="mt-1 flex items-center gap-2 text-[11px] text-neutral-500">
                    {formatTimestamp(th.lastMessageAt) && (
                      <span className="truncate">{formatTimestamp(th.lastMessageAt)}</span>
                    )}
                    <span className="inline-block h-1 w-1 rounded-full bg-neutral-300" aria-hidden="true" />
                    <span className="truncate">
                      {th.checkIn} ~ {th.checkOut} · {th.nights} {t("nights")}
                    </span>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  {th.unreadCount > 0 && (
                    <span className="shrink-0 rounded-full bg-brand px-2 py-0.5 text-xs font-semibold text-white">
                      {th.unreadCount}
                    </span>
                  )}
                </div>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
