"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import Container from "@/components/layout/Container";
import { categories } from "@/lib/mockData";
import { cn } from "@/lib/utils";

export default function CategoryPills() {
  const searchParams = useSearchParams();
  const active = searchParams.get("category") ?? "trending";

  return (
    <div className="sticky top-[76px] z-40 border-b border-neutral-200 bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <Container className="py-3">
        <div className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {categories.map((c) => {
            const Icon = c.icon;
            const isActive = c.slug === active;

            return (
              <Link
                key={c.slug}
                href={c.slug === "trending" ? "/" : `/?category=${c.slug}`}
                className={cn(
                  "flex shrink-0 items-center gap-2 rounded-full border px-4 py-2 text-sm transition",
                  isActive
                    ? "border-brand bg-brand/5 text-brand"
                    : "border-neutral-200 bg-white text-neutral-800 hover:bg-neutral-50"
                )}
              >
                <Icon className="h-4 w-4" />
                <span>{c.label}</span>
              </Link>
            );
          })}
        </div>
      </Container>
    </div>
  );
}
