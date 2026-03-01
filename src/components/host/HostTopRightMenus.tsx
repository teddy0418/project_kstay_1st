"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { Bell, Mail, User2, Settings, LogOut, ExternalLink } from "lucide-react";

type MenuKey = "notif" | "msg" | "profile" | null;

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function useOutsideClose(ref: React.RefObject<HTMLElement | null>, isOpen: boolean, onClose: () => void) {
  useEffect(() => {
    if (!isOpen) return;

    const onDown = (e: MouseEvent) => {
      const el = ref.current;
      if (!el) return;
      if (!el.contains(e.target as Node)) onClose();
    };

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [ref, isOpen, onClose]);
}

function Panel({
  open,
  children,
  widthClass = "w-80",
}: {
  open: boolean;
  children: React.ReactNode;
  widthClass?: string;
}) {
  return (
    <div
      className={cx(
        "absolute right-0 mt-2 rounded-2xl border border-neutral-200 bg-white shadow-lg overflow-hidden",
        "transition-all duration-200 ease-out origin-top-right",
        widthClass,
        open ? "opacity-100 translate-y-0 pointer-events-auto" : "opacity-0 -translate-y-2 pointer-events-none"
      )}
    >
      {children}
    </div>
  );
}

export default function HostTopRightMenus() {
  const [open, setOpen] = useState<MenuKey>(null);
  const wrapRef = useRef<HTMLDivElement | null>(null);

  const isAnyOpen = open !== null;
  useOutsideClose(wrapRef, isAnyOpen, () => setOpen(null));

  const counts = useMemo(() => {
    return { notif: 0, msg: 0 };
  }, []);

  const toggle = (key: Exclude<MenuKey, null>) => {
    setOpen((prev) => (prev === key ? null : key));
  };

  return (
    <div ref={wrapRef} className="relative flex flex-shrink-0 flex-wrap items-center justify-end gap-1 sm:gap-2 min-w-0">
      <Link
        href="/"
        className="rounded-full border border-neutral-200 bg-white px-2.5 py-1.5 sm:px-4 sm:py-2 text-[11px] sm:text-sm font-medium text-neutral-700 hover:bg-neutral-50 transition shrink-0 inline-flex items-center justify-center gap-1 sm:gap-1.5"
        aria-label="게스트 모드로 전환"
      >
        <ExternalLink className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" aria-hidden />
        <span>게스트 모드</span>
      </Link>
      <div className="relative">
        <button
          type="button"
          onClick={() => toggle("notif")}
          className={cx(
            "h-9 w-9 sm:h-10 sm:w-10 rounded-full inline-flex items-center justify-center shrink-0",
            "hover:bg-neutral-100 transition",
            open === "notif" && "bg-neutral-100"
          )}
          aria-label="알림"
          aria-expanded={open === "notif"}
        >
          <Bell className="h-4 w-4 sm:h-5 sm:w-5" />
          {counts.notif > 0 ? (
            <span className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-white" />
          ) : null}
        </button>

        <Panel open={open === "notif"}>
          <div className="px-4 py-3 border-b border-neutral-200">
            <div className="text-sm font-bold">알림</div>
            <div className="text-xs text-neutral-500 mt-0.5">운영/예약/정산 관련 알림</div>
          </div>
          <div className="px-4 py-4 text-sm text-neutral-600">아직 새로운 알림이 없습니다.</div>
          <div className="px-4 py-3 border-t border-neutral-200">
            <Link href="/host/notifications" className="text-sm font-semibold hover:underline">
              알림 모두 보기
            </Link>
          </div>
        </Panel>
      </div>

      <div className="relative">
        <button
          type="button"
          onClick={() => toggle("msg")}
          className={cx(
            "h-9 w-9 sm:h-10 sm:w-10 rounded-full inline-flex items-center justify-center shrink-0",
            "hover:bg-neutral-100 transition",
            open === "msg" && "bg-neutral-100"
          )}
          aria-label="메시지"
          aria-expanded={open === "msg"}
        >
          <Mail className="h-4 w-4 sm:h-5 sm:w-5" />
          {counts.msg > 0 ? (
            <span className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-white" />
          ) : null}
        </button>

        <Panel open={open === "msg"}>
          <div className="px-4 py-3 border-b border-neutral-200">
            <div className="text-sm font-bold">메시지</div>
            <div className="text-xs text-neutral-500 mt-0.5">게스트 문의 / 운영 메시지</div>
          </div>
          <div className="px-4 py-4 text-sm text-neutral-600">아직 메시지가 없습니다.</div>
          <div className="px-4 py-3 border-t border-neutral-200">
            <Link href="/host/messages" className="text-sm font-semibold hover:underline">
              메시지함 열기
            </Link>
          </div>
        </Panel>
      </div>

      <div className="relative">
        <button
          type="button"
          onClick={() => toggle("profile")}
          className={cx(
            "h-9 w-9 sm:h-10 sm:w-10 rounded-full inline-flex items-center justify-center shrink-0",
            "hover:bg-neutral-100 transition",
            open === "profile" && "bg-neutral-100"
          )}
          aria-label="프로필"
          aria-expanded={open === "profile"}
        >
          <User2 className="h-4 w-4 sm:h-5 sm:w-5" />
        </button>

        <Panel open={open === "profile"} widthClass="w-64">
          <div className="px-4 py-3 border-b border-neutral-200">
            <div className="text-sm font-bold">계정</div>
            <div className="text-xs text-neutral-500 mt-0.5">파트너 계정 설정</div>
          </div>
          <div className="py-2">
            <Link
              href="/host/account"
              className="px-4 py-2.5 text-sm font-semibold flex items-center gap-2 hover:bg-neutral-50 transition"
            >
              <Settings className="h-4 w-4" />
              계정 관리
            </Link>
            <Link
              href="/logout"
              className="px-4 py-2.5 text-sm font-semibold flex items-center gap-2 hover:bg-neutral-50 transition"
            >
              <LogOut className="h-4 w-4" />
              로그아웃
            </Link>
          </div>
        </Panel>
      </div>
    </div>
  );
}
