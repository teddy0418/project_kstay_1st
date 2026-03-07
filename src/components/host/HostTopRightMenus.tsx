"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { User2, Settings, LogOut, ExternalLink } from "lucide-react";

type MenuKey = "profile" | null;

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
        "absolute right-0 top-full mt-1.5 rounded-2xl border border-neutral-200 bg-white shadow-lg overflow-hidden",
        "transition-all duration-200 ease-out origin-top-right",
        "w-72 max-w-[calc(100vw-1rem)] sm:max-w-none",
        widthClass === "w-40" && "!w-40",
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

        <Panel open={open === "profile"} widthClass="w-40">
          <div className="px-4 py-2.5 border-b border-neutral-100 text-center">
            <div className="text-sm font-bold">계정</div>
            <div className="text-xs text-neutral-500 mt-0.5">설정 및 로그아웃</div>
          </div>
          <div className="py-1.5 px-4 text-center">
            <Link
              href="/host/account"
              className="py-2.5 px-2 text-sm font-semibold flex items-center justify-center gap-2 hover:bg-neutral-50 transition rounded-lg"
            >
              <Settings className="h-4 w-4 shrink-0" />
              계정 관리
            </Link>
            <Link
              href="/logout"
              className="py-2.5 px-2 text-sm font-semibold flex items-center justify-center gap-2 hover:bg-neutral-50 transition rounded-lg"
            >
              <LogOut className="h-4 w-4 shrink-0" />
              로그아웃
            </Link>
          </div>
        </Panel>
      </div>
    </div>
  );
}
