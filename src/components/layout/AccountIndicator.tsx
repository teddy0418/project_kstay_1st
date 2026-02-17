"use client";

import Link from "next/link";
import { UserCircle2 } from "lucide-react";
import { useAuth } from "@/components/ui/AuthProvider";

export default function AccountIndicator() {
  const { isAuthed } = useAuth();

  if (!isAuthed) return null;

  return (
    <Link
      href="/profile"
      className="relative inline-flex h-10 w-10 items-center justify-center rounded-full hover:bg-neutral-100 transition"
      aria-label="Profile"
      title="Profile"
    >
      <UserCircle2 className="h-6 w-6" />
      {/* 로그인 상태 인디케이터(초록 점) */}
      <span className="absolute right-1 top-1 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-white" />
    </Link>
  );
}
