"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import Container from "@/components/layout/Container";
import { useI18n } from "@/components/ui/LanguageProvider";
import { useAuth } from "@/components/ui/AuthProvider";
import EmptyState from "@/components/ui/EmptyState";
import { apiClient } from "@/lib/api/client";

type TicketRow = {
  ticketId: string;
  subject: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  lastMessageAt: string | null;
  lastBodyPreview: string | null;
  unreadCount: number;
  userName?: string;
  userEmail?: string | null;
};

type Res = { data?: { tickets?: TicketRow[]; isAdmin?: boolean } };

function statusKey(status: string) {
  if (status === "OPEN") return "support_ticket_status_open";
  if (status === "PENDING") return "support_ticket_status_pending";
  if (status === "CLOSED") return "support_ticket_status_closed";
  return "support_ticket_status_open";
}

export default function SupportInboxClient() {
  const { t } = useI18n();
  const { isAuthed } = useAuth();
  const [tickets, setTickets] = useState<TicketRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  const fetchTickets = useCallback(async () => {
    const res = await apiClient.get<Res>("/api/support/tickets").catch(() => ({ data: {} }));
    const data = (res as Res)?.data;
    setTickets(Array.isArray(data?.tickets) ? data.tickets : []);
    setIsAdmin(Boolean(data?.isAdmin));
  }, []);

  useEffect(() => {
    if (!isAuthed) {
      setLoading(false);
      return;
    }
    setLoading(true);
    fetchTickets().finally(() => setLoading(false));
  }, [isAuthed, fetchTickets]);

  if (!isAuthed) {
    return (
      <EmptyState
        title={t("support_inbox")}
        description={t("support_sign_in_required")}
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
          <h1 className="text-xl font-semibold tracking-tight md:text-2xl">{t("support_inbox")}</h1>
          <p className="mt-2 text-xs text-neutral-500 md:text-sm">{t("support_customer_support")}</p>
        </div>
        <Link
          href="/support/new"
          className="rounded-xl bg-neutral-900 px-4 py-3 text-sm font-semibold text-white hover:opacity-90"
        >
          {t("support_new_ticket")}
        </Link>
      </div>

      {tickets.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-neutral-200 bg-white p-8 text-center">
          <p className="text-neutral-600">{t("support_no_tickets")}</p>
          <Link
            href="/support/new"
            className="mt-4 inline-block rounded-xl border border-neutral-200 bg-white px-4 py-2 text-sm font-semibold hover:bg-neutral-50"
          >
            {t("support_new_ticket")}
          </Link>
        </div>
      ) : (
        <ul className="mt-6 space-y-3">
          {tickets.map((tk) => (
            <li key={tk.ticketId}>
              <Link
                href={isAdmin ? `/admin/support/${tk.ticketId}` : `/support/${tk.ticketId}`}
                className="block rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm hover:shadow-md transition"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="font-semibold text-neutral-900 truncate">
                      {isAdmin ? (tk.userName || tk.userEmail || t("guest")) : t("support_customer_support")}
                    </div>
                    <div className="mt-1 flex items-center gap-2 text-xs text-neutral-500">
                      <span>{t(statusKey(tk.status))}</span>
                      {isAdmin && (tk.userName || tk.userEmail) && (
                        <span> · {tk.userName || tk.userEmail}</span>
                      )}
                    </div>
                  </div>
                  {tk.unreadCount > 0 && (
                    <span className="shrink-0 rounded-full bg-brand px-2 py-0.5 text-xs font-semibold text-white">
                      {tk.unreadCount}
                    </span>
                  )}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}

      <Link href="/help" className="mt-8 inline-block text-sm font-semibold text-neutral-600 hover:underline">
        ← {t("help_center")}
      </Link>
    </Container>
  );
}
