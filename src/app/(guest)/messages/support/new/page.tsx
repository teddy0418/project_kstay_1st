"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Container from "@/components/layout/Container";
import { useI18n } from "@/components/ui/LanguageProvider";
import { apiClient } from "@/lib/api/client";
import StatusTag from "@/components/messages/StatusTag";
import ChatBubble from "@/components/messages/ChatBubble";

export default function NewSupportTicketInMessagesPage() {
  const router = useRouter();
  const { t } = useI18n();
  const [ticketId, setTicketId] = useState<string | null>(null);
  const [localMessages, setLocalMessages] = useState<{ id: string; body: string }[]>([]);
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);

  // 게스트당 고객센터 티켓은 최대 1개만 사용.
  // 이미 티켓이 있으면 새로 만들지 않고 해당 채팅방으로 바로 이동.
  useEffect(() => {
    (async () => {
      try {
        const res = await apiClient
          .get<{ tickets?: { ticketId: string }[]; isAdmin?: boolean }>("/api/support/tickets")
          .catch(() => ({ tickets: [] }));
        const tickets = Array.isArray(res.tickets) ? res.tickets : [];
        if (tickets.length > 0) {
          router.replace(`/messages/support/${tickets[0].ticketId}`);
        }
      } catch {
        // ignore
      }
    })();
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const b = body.trim();
    if (!b || sending) return;
    setSending(true);
    try {
      // 첫 메시지이면 티켓 생성, 이후에는 해당 티켓에 이어서 메시지 전송
      if (!ticketId) {
        const res = await apiClient.post<{ id?: string }>("/api/support/tickets", {
          body: b,
        });
        const id = (res as { id?: string })?.id;
        if (id) setTicketId(id);
      } else {
        await apiClient.post(`/api/support/tickets/${ticketId}`, { body: b });
      }

      setLocalMessages((prev) => [...prev, { id: `${Date.now()}-${prev.length}`, body: b }]);
      setBody("");
    } catch {
      // 실패 시 일단 메시지 유지 (사용자 편의를 위해 body를 비우지 않음)
    } finally {
      setSending(false);
    }
  };

  return (
    <Container className="py-10">
      <Link href="/messages" className="text-sm font-semibold hover:underline">
        ← {t("messages_inbox")}
      </Link>

      <div className="mt-6 rounded-2xl border border-neutral-200 bg-white shadow-sm overflow-hidden">
        {/* 헤더: 채팅방처럼 제목 + 진행상태 */}
        <div className="border-b border-neutral-100 px-4 py-3 sm:px-5 sm:py-4">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-base font-semibold sm:text-lg">{t("support_new_ticket")}</h2>
            <StatusTag status="OPEN" label={t("support_ticket_status_open")} />
          </div>
        </div>

        {/* 채팅 영역: 고객센터 인트로 말풍선 + 내가 보낸 말풍선들 */}
        <div className="min-h-[320px] max-h-[70vh] overflow-y-auto bg-neutral-50/50 p-4 space-y-3">
          <ChatBubble
            isMine={false}
            senderLabel={t("support_customer_support")}
            body={t("support_intro")}
            createdAt=""
          />
          {localMessages.map((m) => (
            <ChatBubble
              key={m.id}
              isMine
              senderLabel={t("support_you")}
              body={m.body}
              createdAt=""
            />
          ))}
        </div>

        {/* 하단 입력창 + 보내기 (보낸 후 /messages/support/[id] 채팅창에서 말풍선으로 표시) */}
        <form onSubmit={handleSubmit} className="border-t border-neutral-200 bg-white p-4">
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value.slice(0, 4000))}
            placeholder={t("support_body_placeholder")}
            className="w-full rounded-2xl border border-neutral-200 px-4 py-3 text-sm leading-relaxed placeholder:text-neutral-400 focus:border-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-200 min-h-[88px] max-h-[160px] resize-y"
            maxLength={4000}
            required
            disabled={sending}
          />
          <div className="mt-3 flex items-center justify-between gap-2">
            <span className="text-xs text-neutral-400">{body.length}/4000</span>
            <button
              type="submit"
              disabled={sending || !body.trim()}
              className="rounded-full bg-neutral-900 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {sending ? "..." : t("message_send")}
            </button>
          </div>
        </form>
      </div>
    </Container>
  );
}
