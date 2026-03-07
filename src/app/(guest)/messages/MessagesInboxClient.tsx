"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import Container from "@/components/layout/Container";
import { useI18n } from "@/components/ui/LanguageProvider";
import { useAuth } from "@/components/ui/AuthProvider";
import EmptyState from "@/components/ui/EmptyState";
import { apiClient } from "@/lib/api/client";

type BookingThread = {
  bookingId: string;
  listingTitle: string;
  checkIn: string;
  checkOut: string;
  nights: number;
  lastMessageAt: string | null;
  lastBodyPreview: string | null;
  unreadCount: number;
};

type SupportTicketRow = {
  ticketId: string;
  subject: string;
  status: string;
  lastMessageAt: string | null;
  lastBodyPreview: string | null;
  unreadCount: number;
};

type InboxItem =
  | {
      type: "booking";
      id: string;
      title: string;
      subtitle: string;
      lastMessageAt: string | null;
      lastBodyPreview: string | null;
      unreadCount: number;
    }
  | {
      type: "support";
      id: string;
      title: string;
      subtitle: string;
      lastMessageAt: string | null;
      lastBodyPreview: string | null;
      unreadCount: number;
    };

function statusKey(status: string) {
  if (status === "OPEN") return "support_ticket_status_open";
  if (status === "PENDING") return "support_ticket_status_pending";
  if (status === "CLOSED") return "support_ticket_status_closed";
  return "support_ticket_status_open";
}

function formatTimestamp(locale: string, value: string | null) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(d);
}

export default function MessagesInboxClient() {
  const { t, locale } = useI18n();
  const { isAuthed } = useAuth();
  const [items, setItems] = useState<InboxItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    const [bookingsRes, supportRes] = await Promise.all([
      apiClient
        .get<{ threads?: BookingThread[]; role?: string }>("/api/messages/bookings")
        .catch(() => ({ threads: [] })),
      apiClient
        .get<{ tickets?: SupportTicketRow[]; isAdmin?: boolean }>("/api/support/tickets?mineLatestOnly=1")
        .catch(() => ({ tickets: [] })),
    ]);
    const bookingThreads = Array.isArray(bookingsRes.threads) ? bookingsRes.threads : [];
    const supportTickets = Array.isArray(supportRes.tickets) ? supportRes.tickets : [];

    const list: InboxItem[] = [
      ...bookingThreads.map((th) => ({
        type: "booking" as const,
        id: th.bookingId,
        title: "", // 제목/내용은 목록에서 숨김
        subtitle: `${th.checkIn} ~ ${th.checkOut} · ${th.nights} ${t("nights")}`,
        lastMessageAt: th.lastMessageAt,
        lastBodyPreview: null,
        unreadCount: th.unreadCount,
      })),
      ...supportTickets.map((tk) => ({
        type: "support" as const,
        id: tk.ticketId,
        title: "", // 제목/내용은 목록에서 숨김
        subtitle: t(statusKey(tk.status)),
        lastMessageAt: tk.lastMessageAt,
        lastBodyPreview: null,
        unreadCount: tk.unreadCount,
      })),
    ];

    list.sort((a, b) => {
      const at = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0;
      const bt = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0;
      return bt - at;
    });

    setItems(list);
  }, [t]);

  useEffect(() => {
    if (!isAuthed) {
      setLoading(false);
      return;
    }
    setLoading(true);
    fetchAll().finally(() => setLoading(false));
  }, [isAuthed, fetchAll]);

  if (!isAuthed) {
    return (
      <EmptyState
        title={t("messages")}
        description={t("messages_sign_in_required")}
        primaryHref="/"
        primaryLabel={t("home")}
        secondaryHref="/help"
        secondaryLabel={t("help_center")}
      />
    );
  }

  if (loading) {
    return (
      <Container className="py-10">
        <p className="text-neutral-500">{t("loading")}</p>
      </Container>
    );
  }

  return (
    <Container className="py-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold tracking-tight md:text-2xl">{t("messages_inbox")}</h1>
          <p className="mt-2 text-xs text-neutral-500 md:text-sm">{t("messages_with_host")} · {t("support_customer_support")}</p>
        </div>
        <Link
          href="/messages/support/new"
          className="rounded-xl border border-neutral-300 bg-white px-4 py-3 text-sm font-semibold text-neutral-800 hover:bg-neutral-50"
        >
          {t("support_contact_btn")}
        </Link>
      </div>

      {items.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-neutral-200 bg-white p-8 text-center">
          <p className="text-neutral-600">{t("messages_no_threads")}</p>
          <p className="mt-2 text-sm text-neutral-500">{t("support_no_tickets")}</p>
          <Link
            href="/"
            className="mt-6 inline-flex rounded-xl border border-neutral-200 bg-white px-4 py-2 text-sm font-semibold hover:bg-neutral-50"
          >
            ← {t("home")}
          </Link>
        </div>
      ) : (
        <ul className="mt-6 space-y-3">
          {items.map((it) => (
            <li key={`${it.type}-${it.id}`}>
              <Link
                href={it.type === "booking" ? `/messages/booking/${it.id}` : `/messages/support/${it.id}`}
                className="block rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm hover:shadow-md transition"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-neutral-900 truncate">
                        {it.type === "booking" ? t("messages_with_host") : t("support_customer_support")}
                      </span>
                    </div>
                    <div className="mt-1 flex items-center gap-2 text-[11px] text-neutral-500">
                      {formatTimestamp(locale, it.lastMessageAt) && (
                        <span className="truncate">{formatTimestamp(locale, it.lastMessageAt)}</span>
                      )}
                      <span className="inline-block h-1 w-1 rounded-full bg-neutral-300" aria-hidden="true" />
                      <span className="truncate">{it.subtitle}</span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    {it.unreadCount > 0 && (
                      <span className="shrink-0 rounded-full bg-brand px-2 py-0.5 text-xs font-semibold text-white">
                        {it.unreadCount}
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Container>
  );
}
