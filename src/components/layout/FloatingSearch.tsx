"use client";

import { Suspense } from "react";
import SearchBar from "@/components/ui/SearchBar";
import Container from "@/components/layout/Container";

export default function FloatingSearch() {
  return (
    <div className="relative z-40 mt-4">
      <Container>
        <Suspense fallback={<div className="h-14 rounded-2xl bg-neutral-100 animate-pulse" />}>
          <SearchBar />
        </Suspense>
      </Container>
    </div>
  );
}
