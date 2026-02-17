"use client";

import { usePathname } from "next/navigation";
import Container from "@/components/layout/Container";
import SearchBar from "@/components/ui/SearchBar";

export default function FloatingSearch() {
  const pathname = usePathname();
  const show =
    pathname === "/" ||
    pathname.startsWith("/browse") ||
    pathname.startsWith("/listings") ||
    pathname.startsWith("/checkout");
  console.log("[KSTAY] 6. FloatingSearch render (client)", { pathname, show });

  if (!show) return null;

  return (
    <div className="sticky top-[76px] z-40 border-b border-neutral-200 bg-white/85 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <Container className="py-3">
        <SearchBar />
      </Container>
    </div>
  );
}
