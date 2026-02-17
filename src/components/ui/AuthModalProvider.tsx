"use client";

import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import { X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth, type UserRole } from "@/components/ui/AuthProvider";
import { useComingSoon } from "@/hooks/useComingSoon";

type OpenOpts = {
  next?: string;
  role?: UserRole;
};

type Ctx = {
  isOpen: boolean;
  open: (opts?: OpenOpts) => void;
  close: () => void;
};

const AuthModalContext = createContext<Ctx | null>(null);

export default function AuthModalProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [nextPath, setNextPath] = useState<string | undefined>(undefined);

  const open = (opts?: OpenOpts) => {
    setNextPath(opts?.next);
    setIsOpen(true);
  };

  const close = () => setIsOpen(false);

  const value = useMemo(() => ({ isOpen, open, close }), [isOpen]);

  return (
    <AuthModalContext.Provider value={value}>
      {children}
      <AuthModal isOpen={isOpen} onClose={close} nextPath={nextPath} />
    </AuthModalContext.Provider>
  );
}

export function useAuthModal() {
  const ctx = useContext(AuthModalContext);
  if (!ctx) throw new Error("useAuthModal must be used within <AuthModalProvider/>");
  return ctx;
}

function AuthModal({
  isOpen,
  onClose,
  nextPath,
}: {
  isOpen: boolean;
  onClose: () => void;
  nextPath?: string;
}) {
  const router = useRouter();
  const { signInWithGoogle } = useAuth();
  const comingSoon = useComingSoon();
  const panelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    const onDown = (e: MouseEvent) => {
      const target = e.target as Node;
      if (panelRef.current && !panelRef.current.contains(target)) onClose();
    };

    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onDown);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const onGoogle = async () => {
    const callbackUrl =
      nextPath && nextPath.startsWith("/")
        ? nextPath
        : `${window.location.pathname}${window.location.search || ""}`;
    onClose();
    await signInWithGoogle(callbackUrl);
    router.refresh();
  };

  return (
    <div className="fixed inset-0 z-[200]">
      <div className="absolute inset-0 bg-black/40" />

      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div
          ref={panelRef}
          className="w-full max-w-[560px] rounded-3xl bg-white shadow-xl border border-neutral-200
                     transition-all duration-200 ease-out opacity-100 translate-y-0"
        >
          <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full hover:bg-neutral-100 transition"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
            <div className="text-sm font-semibold">Log in or sign up</div>
            <div className="h-9 w-9" />
          </div>

          <div className="px-6 py-6">
            <div className="text-2xl font-extrabold tracking-tight">Welcome to KSTAY</div>
            <div className="mt-2 text-sm text-neutral-500">
              Sign in to save your wishlist and manage bookings.
            </div>

            <div className="mt-6 grid gap-3">
              <button
                type="button"
                onClick={onGoogle}
                className="w-full rounded-2xl bg-neutral-900 px-5 py-4 text-white text-sm font-semibold hover:opacity-95 transition"
              >
                Continue with Google
              </button>

              <button
                type="button"
                onClick={() => comingSoon({ message: "MVP: Email login will be added next." })}
                className="w-full rounded-2xl border border-neutral-200 bg-white px-5 py-4 text-sm font-semibold hover:bg-neutral-50 transition"
              >
                Continue with email
              </button>
            </div>

            <div className="mt-5 text-xs text-neutral-500 leading-5">
              By continuing, you agree to KSTAY Terms and Privacy Policy.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
