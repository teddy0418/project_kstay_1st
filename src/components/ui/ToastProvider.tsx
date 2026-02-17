"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";

type Toast = { id: string; message: string };
type Ctx = { toast: (message: string) => void };

const ToastContext = createContext<Ctx | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  console.log("[KSTAY] ToastProvider mount (client)");
  const [items, setItems] = useState<Toast[]>([]);

  const toast = useCallback((message: string) => {
    const id = Math.random().toString(36).slice(2);
    setItems((prev) => [...prev, { id, message }]);
    setTimeout(() => {
      setItems((prev) => prev.filter((t) => t.id !== id));
    }, 2200);
  }, []);

  const value = useMemo(() => ({ toast }), [toast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="fixed bottom-20 left-1/2 z-[80] -translate-x-1/2 space-y-2 px-4">
        {items.map((t) => (
          <div
            key={t.id}
            className="rounded-full bg-neutral-900/90 px-4 py-2 text-sm text-white shadow-elevated"
          >
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}

export function useOptionalToast() {
  return useContext(ToastContext);
}
