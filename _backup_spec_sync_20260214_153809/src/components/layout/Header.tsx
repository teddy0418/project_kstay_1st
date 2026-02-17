import Link from "next/link";
import { Globe, Menu, UserCircle2 } from "lucide-react";
import Container from "@/components/layout/Container";
import SearchBar from "@/components/ui/SearchBar";

export default function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-neutral-200 bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <Container className="flex h-[76px] items-center justify-between gap-4">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-2">
          <div className="h-10 w-10 rounded-xl bg-brand text-brand-foreground grid place-items-center font-semibold">
            K
          </div>
          <div className="hidden sm:block leading-tight">
            <div className="text-sm font-semibold tracking-tight">KSTAY</div>
            <div className="text-xs text-neutral-500">Stay Korea, feel local</div>
          </div>
        </Link>

        {/* Search */}
        <SearchBar />

        {/* Right */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="hidden lg:inline-flex rounded-full px-4 py-2 text-sm font-medium hover:bg-neutral-100"
          >
            Become a host
          </button>

          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-full hover:bg-neutral-100"
            aria-label="Language"
            title="Language"
          >
            <Globe className="h-5 w-5" />
          </button>

          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-white px-3 py-2 shadow-soft hover:shadow-elevated transition"
            aria-label="Account menu"
          >
            <Menu className="h-5 w-5" />
            <UserCircle2 className="h-6 w-6 text-neutral-700" />
          </button>
        </div>
      </Container>
    </header>
  );
}
