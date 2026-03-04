"use client";

type StatusTagProps = {
  status: "OPEN" | "PENDING" | "CLOSED";
  label: string;
  className?: string;
};

const STATUS_STYLES: Record<StatusTagProps["status"], string> = {
  OPEN: "bg-amber-100 text-amber-800 border-amber-200",
  PENDING: "bg-blue-100 text-blue-800 border-blue-200",
  CLOSED: "bg-neutral-100 text-neutral-600 border-neutral-200",
};

export default function StatusTag({ status, label, className = "" }: StatusTagProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLES[status]} ${className}`}
    >
      {label}
    </span>
  );
}
