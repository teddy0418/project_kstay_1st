"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import Container from "@/components/layout/Container";
import { useI18n } from "@/components/ui/LanguageProvider";
import { apiClient } from "@/lib/api/client";
import { formatDateTime } from "@/lib/format";
import ChatBubble from "@/components/messages/ChatBubble";

type Message = {
  id: string;
  body: string;
  senderRole: string;
  senderName: string;
  senderProfilePhotoUrl: string | null;
  createdAt: string;
};

type Res = { data?: { messages?: Message[] } };

export default function MessageThreadPage() {
  const params = useParams();
  const bookingId = Array.isArray(params?.bookingId) ? params.bookingId[0] : String(params?.bookingId ?? "");
  const { t, locale } = useI18n();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);

  const fetchMessages = useCallback(async () => {
    if (!bookingId) return;
    const res = await apiClient.get<Res>(`/api/messages/bookings/${bookingId}`).catch(() => ({ data: {} }));
    const data = (res as Res)?.data;
    setMessages(Array.isArray(data?.messages) ? data.messages : []);
  }, [bookingId]);

  useEffect(() => {
    if (!bookingId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    fetchMessages().finally(() => setLoading(false));
  }, [bookingId, fetchMessages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = body.trim();
    if (!text || sending || !bookingId) return;
    setSending(true);
    try {
      await apiClient.post(`/api/messages/bookings/${bookingId}`, { body: text });
      setBody("");
      await fetchMessages();
    } finally {
      setSending(false);
    }
  };

  if (!bookingId) {
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

  return (
    <Container className="py-10">
      <Link href="/messages" className="text-sm font-semibold hover:underline">
        ← {t("messages_inbox")}
      </Link>

      <div className="mt-6 rounded-2xl border border-neutral-200 bg-white shadow-sm overflow-hidden">
        <div className="border-b border-neutral-100 p-4">
          <h2 className="text-lg font-semibold">{t("messages_with_host")}</h2>
        </div>

        <div className="min-h-[200px] max-h-[50vh] overflow-y-auto p-4 space-y-3">
          {messages.length === 0 ? (
            <p className="text-sm text-neutral-500">{t("messages_no_threads")}</p>
          ) : (
            messages.map((m) => (
              <ChatBubble
                key={m.id}
                isMine={m.senderRole === "GUEST"}
                senderLabel={`${m.senderRole === "GUEST" ? t("message_guest") : t("message_host")} · ${m.senderName}`}
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
            placeholder={t("message_placeholder")}
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
