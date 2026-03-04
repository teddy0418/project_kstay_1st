"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useI18n } from "@/components/ui/LanguageProvider";
import { apiClient } from "@/lib/api/client";
import ChatBubble from "@/components/messages/ChatBubble";
import StatusTag from "@/components/messages/StatusTag";

type Message = {
  id: string;
  body: string;
  senderRole: string;
  senderName: string;
  createdAt: string;
};

type TicketInfo = {
  id: string;
  subject: string;
  status: "OPEN" | "PENDING" | "CLOSED";
  userName?: string;
  userEmail?: string | null;
};

function statusKey(status: string) {
  if (status === "OPEN") return "support_ticket_status_open";
  if (status === "PENDING") return "support_ticket_status_pending";
  if (status === "CLOSED") return "support_ticket_status_closed";
  return "support_ticket_status_open";
}

export default function AdminSupportTicketPage() {
  const params = useParams();
  const ticketId = Array.isArray(params?.ticketId) ? params.ticketId[0] : String(params?.ticketId ?? "");
  const { t } = useI18n();
  const [ticket, setTicket] = useState<TicketInfo | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [statusUpdating, setStatusUpdating] = useState(false);

  const fetchDetail = useCallback(async () => {
    if (!ticketId) return;
    const res = await apiClient
      .get<{ ticket: TicketInfo; messages: Message[]; canReply: boolean }>(`/api/support/tickets/${ticketId}`)
      .catch(() => null);
    if (!res) {
      setTicket(null);
      setMessages([]);
      return;
    }
    setTicket(res.ticket ?? null);
    setMessages(Array.isArray(res.messages) ? res.messages : []);
  }, [ticketId]);

  useEffect(() => {
    if (!ticketId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    fetchDetail().finally(() => setLoading(false));
  }, [ticketId, fetchDetail]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = body.trim();
    if (!text || sending || !ticketId) return;
    setSending(true);
    try {
      await apiClient.post(`/api/support/tickets/${ticketId}`, { body: text });
      setBody("");
      await fetchDetail();
    } finally {
      setSending(false);
    }
  };

  const handleStatusChange = async (newStatus: "OPEN" | "PENDING" | "CLOSED") => {
    if (!ticketId || ticket?.status === newStatus || statusUpdating) return;
    setStatusUpdating(true);
    try {
      await apiClient.patch(`/api/support/tickets/${ticketId}`, { status: newStatus });
      await fetchDetail();
    } finally {
      setStatusUpdating(false);
    }
  };

  if (!ticketId) {
    return (
      <div className="rounded-2xl border border-neutral-200 bg-white shadow-sm p-6">
        <p className="text-neutral-500">{t("board_post_not_found")}</p>
        <Link href="/admin/support" className="mt-4 inline-block text-sm font-semibold underline">
          ← {t("support_inbox")}
        </Link>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="rounded-2xl border border-neutral-200 bg-white shadow-sm p-6">
        <p className="text-neutral-500">{t("loading")}</p>
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="rounded-2xl border border-neutral-200 bg-white shadow-sm p-6">
        <p className="text-neutral-500">{t("board_post_not_found")}</p>
        <Link href="/admin/support" className="mt-4 inline-block text-sm font-semibold underline">
          ← {t("support_inbox")}
        </Link>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-neutral-200 bg-white shadow-sm overflow-hidden">
      <div className="border-b border-neutral-100 p-4">
        <Link href="/admin/support" className="text-sm font-semibold hover:underline">
          ← {t("support_inbox")}
        </Link>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <h2 className="text-lg font-semibold">{ticket.subject}</h2>
          <StatusTag status={ticket.status} label={t(statusKey(ticket.status))} />
          <select
            value={ticket.status}
            onChange={(e) => handleStatusChange(e.target.value as "OPEN" | "PENDING" | "CLOSED")}
            disabled={statusUpdating}
            className="rounded-lg border border-neutral-200 px-2 py-1 text-xs font-medium text-neutral-700 disabled:opacity-50"
            aria-label={t("support_ticket_status_open")}
          >
            <option value="OPEN">{t("support_ticket_status_open")}</option>
            <option value="PENDING">{t("support_ticket_status_pending")}</option>
            <option value="CLOSED">{t("support_ticket_status_closed")}</option>
          </select>
        </div>
        {(ticket.userName || ticket.userEmail) && (
          <p className="text-xs text-neutral-500 mt-1">{ticket.userName || ticket.userEmail}</p>
        )}
      </div>

      <div className="min-h-[200px] max-h-[50vh] overflow-y-auto p-4 space-y-3">
        {messages.length === 0 ? (
          <p className="text-sm text-neutral-500">{t("support_no_tickets")}</p>
        ) : (
          messages.map((m) => (
            <ChatBubble
              key={m.id}
              isMine={m.senderRole === "SUPPORT"}
              senderLabel={m.senderRole === "USER" ? `${t("support_you")} · ${m.senderName}` : `${t("support_customer_support")} · ${m.senderName}`}
              body={m.body}
              createdAt={new Date(m.createdAt).toLocaleString()}
            />
          ))
        )}
      </div>

      <form onSubmit={handleSubmit} className="border-t border-neutral-200 p-4">
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value.slice(0, 4000))}
          placeholder={t("support_body_placeholder")}
          className="w-full rounded-xl border border-neutral-200 p-3 text-sm min-h-[80px] resize-y"
          maxLength={4000}
          disabled={sending}
        />
        <button
          type="submit"
          disabled={sending || !body.trim()}
          className="mt-2 w-full rounded-xl bg-neutral-900 py-3 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
        >
          {sending ? "..." : t("message_send")}
        </button>
      </form>
    </div>
  );
}
