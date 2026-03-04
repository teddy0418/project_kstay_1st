"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useI18n } from "@/components/ui/LanguageProvider";
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
  userCountry?: string | null;
};

function formatTimestamp(value: string | null, fallback: string) {
  const v = value || fallback;
  if (!v) return "";
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString();
}

function countryLabel(code?: string | null) {
  if (!code) return "";
  const v = code.trim().toUpperCase();
  if (v === "KR") return "대한민국";
  if (v === "JP") return "日本";
  if (v === "CN") return "中国";
  if (v === "US") return "United States";
  if (v === "TW") return "台灣";
  if (v === "HK") return "香港";
  if (v === "SG") return "Singapore";
  if (v === "TH") return "Thailand";
  if (v === "OTHER") return "기타";
  return code;
}

function statusKey(status: string) {
  if (status === "OPEN") return "support_ticket_status_open";
  if (status === "PENDING") return "support_ticket_status_pending";
  if (status === "CLOSED") return "support_ticket_status_closed";
  return "support_ticket_status_open";
}

export default function AdminSupportInboxClient() {
  const { t } = useI18n();
  const [tickets, setTickets] = useState<TicketRow[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTickets = useCallback(async () => {
    const res = await apiClient
      .get<{ tickets?: TicketRow[]; isAdmin?: boolean }>("/api/support/tickets")
      .catch(() => ({ tickets: [] }));
    setTickets(Array.isArray(res.tickets) ? res.tickets : []);
  }, []);

  useEffect(() => {
    setLoading(true);
    fetchTickets().finally(() => setLoading(false));
  }, [fetchTickets]);

  if (loading) {
    return (
      <div className="rounded-2xl border border-neutral-200 bg-white shadow-sm p-6">
        <p className="text-neutral-500">{t("loading")}</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-neutral-200 bg-white shadow-sm overflow-hidden">
      <div className="border-b border-neutral-100 p-4 sm:p-6">
        <h1 className="text-xl font-extrabold tracking-tight md:text-2xl">{t("support_inbox")}</h1>
        <p className="mt-2 text-xs text-neutral-500 md:text-sm">{t("support_customer_support")}</p>
      </div>

      {tickets.length === 0 ? (
        <div className="p-8 text-center text-neutral-600">{t("support_no_tickets")}</div>
      ) : (
        <ul className="divide-y divide-neutral-100">
          {tickets.map((tk) => (
            <li key={tk.ticketId}>
              <Link
                href={`/admin/support/${tk.ticketId}`}
                className="block p-4 sm:p-6 hover:bg-neutral-50 transition"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 text-sm font-semibold text-neutral-900">
                      <span className="truncate">{tk.userName || tk.userEmail || t("guest")}</span>
                      {tk.userCountry && (
                        <span className="shrink-0 rounded bg-neutral-100 px-1.5 py-0.5 text-[10px] font-medium text-neutral-600">
                          {countryLabel(tk.userCountry)}
                        </span>
                      )}
                    </div>
                    <div className="mt-1 flex items-center gap-2 text-[11px] text-neutral-500">
                      <span className="truncate">
                        {formatTimestamp(tk.lastMessageAt, tk.updatedAt)}
                      </span>
                      <span className="inline-block h-1 w-1 rounded-full bg-neutral-300" aria-hidden="true" />
                      <span className="truncate">{t(statusKey(tk.status))}</span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    {tk.unreadCount > 0 && (
                      <span className="shrink-0 rounded-full bg-brand px-2 py-0.5 text-xs font-semibold text-white">
                        {tk.unreadCount}
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
