"use client";

import { usePathname } from "next/navigation";
import SearchBar from "@/components/ui/SearchBar";
import Container from "@/components/layout/Container";

export default function FloatingSearch() {
  const pathname = usePathname();

  const hide =
    pathname.startsWith("/board") ||
    pathname.startsWith("/auth") ||
    pathname.startsWith("/login") ||
    pathname.startsWith("/signup") ||
    pathname.startsWith("/checkout") ||
    pathname.startsWith("/listings/");

  if (hide) return null;

  return (
    <div className="mt-4">
      <Container>
        <SearchBar />
      </Container>
    </div>
  );
}
