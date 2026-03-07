"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import Container from "@/components/layout/Container";
import { useI18n } from "@/components/ui/LanguageProvider";
import { apiClient } from "@/lib/api/client";
import { formatDateTime } from "@/lib/format";
import ChatBubble from "@/components/messages/ChatBubble";
import StatusTag from "@/components/messages/StatusTag";

type Message = {
  id: string;
  body: string;
  senderRole: string;
  senderName: string;
  createdAt: string;
};

type DetailResponse = {
  ticket: { id: string; subject: string; status: "OPEN" | "PENDING" | "CLOSED" };
  messages: Message[];
  canReply: boolean;
};

function statusKey(status: string) {
  if (status === "OPEN") return "support_ticket_status_open";
  if (status === "PENDING") return "support_ticket_status_pending";
  if (status === "CLOSED") return "support_ticket_status_closed";
  return "support_ticket_status_open";
}

export default function SupportTicketInMessagesPage() {
  const params = useParams();
  const ticketId = Array.isArray(params?.ticketId) ? params.ticketId[0] : String(params?.ticketId ?? "");
  const { t, locale } = useI18n();
  const [ticket, setTicket] = useState<{ id: string; subject: string; status: "OPEN" | "PENDING" | "CLOSED" } | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);

  const fetchDetail = useCallback(async () => {
    if (!ticketId) return;
    const res = await apiClient.get<DetailResponse>(`/api/support/tickets/${ticketId}`).catch(() => null);
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

  if (!ticketId) {
    return (
      <Container className="py-10">
        <p className="text-neutral-500">{t("board_post_not_found")}</p>
        <Link href="/messages" className="mt-4 inline-block text-sm font-semibold underline">
          ← {t("messages_inbox")}
        </Link>
      </Container>
    );
  }

  if (loading) {
    return (
      <Container className="py-10">
        <p className="text-neutral-500">{t("loading")}</p>
      </Container>
    );
  }

  if (!ticket) {
    return (
      <Container className="py-10">
        <p className="text-neutral-500">{t("board_post_not_found")}</p>
        <Link href="/messages" className="mt-4 inline-block text-sm font-semibold underline">
          ← {t("messages_inbox")}
        </Link>
      </Container>
    );
  }

  return (
    <Container className="py-10">
      <Link href="/messages" className="text-sm font-semibold hover:underline">
        ← {t("messages_inbox")}
      </Link>

      <div className="mt-6 rounded-2xl border border-neutral-200 bg-white shadow-sm overflow-hidden">
        <div className="border-b border-neutral-100 p-4">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-lg font-semibold">{ticket.subject}</h2>
            <StatusTag status={ticket.status} label={t(statusKey(ticket.status))} />
          </div>
        </div>

        <div className="min-h-[320px] max-h-[70vh] overflow-y-auto p-4 space-y-3">
          {messages.length === 0 ? (
            <p className="text-sm text-neutral-500">{t("support_no_tickets")}</p>
          ) : (
            messages.map((m) => (
              <ChatBubble
                key={m.id}
                isMine={m.senderRole === "USER"}
                senderLabel={m.senderRole === "USER" ? t("support_you") : m.senderName}
                body={m.body}
                createdAt={formatDateTime(locale, m.createdAt)}
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
    </Container>
  );
}
