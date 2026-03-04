"use client";

type ChatBubbleProps = {
  isMine: boolean;
  senderLabel: string;
  body: string;
  createdAt: string;
  className?: string;
};

/** 말풍선 형태 메시지 하나. isMine이면 오른쪽, 아니면 왼쪽 정렬. */
export default function ChatBubble({ isMine, senderLabel, body, createdAt, className = "" }: ChatBubbleProps) {
  return (
    <div
      className={`flex w-full ${isMine ? "justify-end" : "justify-start"} ${className}`}
      role="listitem"
    >
      <div
        className={`max-w-[85%] min-w-0 rounded-2xl px-4 py-3 ${
          isMine
            ? "rounded-br-sm bg-neutral-800 text-white"
            : "rounded-bl-sm bg-neutral-100 text-neutral-900"
        }`}
      >
        <div>
          <div className="text-xs font-semibold opacity-90 mb-1.5">{senderLabel}</div>
          <p className="text-sm whitespace-pre-wrap break-words leading-relaxed">{body}</p>
          {createdAt ? <div className="text-[11px] opacity-75 mt-2">{createdAt}</div> : null}
        </div>
      </div>
    </div>
  );
}
