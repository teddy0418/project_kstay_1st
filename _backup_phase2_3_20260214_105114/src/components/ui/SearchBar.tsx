import { Search } from "lucide-react";

export default function SearchBar() {
  return (
    <div className="flex flex-1 justify-center">
      {/* Desktop */}
      <button
        type="button"
        className="hidden md:flex items-center rounded-full border border-neutral-200 bg-white shadow-soft hover:shadow-elevated transition px-2 py-2"
        aria-label="Search stays"
      >
        <span className="px-4 text-sm font-medium text-neutral-900">Anywhere</span>
        <span className="h-6 w-px bg-neutral-200" />
        <span className="px-4 text-sm font-medium text-neutral-900">Any week</span>
        <span className="h-6 w-px bg-neutral-200" />
        <span className="pl-4 pr-2 text-sm text-neutral-600 flex items-center gap-2">
          Add guests
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-brand text-brand-foreground">
            <Search className="h-4 w-4" />
          </span>
        </span>
      </button>

      {/* Mobile */}
      <button
        type="button"
        className="md:hidden w-full max-w-[520px] flex items-center gap-3 rounded-full border border-neutral-200 bg-white shadow-soft px-4 py-3"
        aria-label="Search stays"
      >
        <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-brand/10">
          <Search className="h-5 w-5 text-brand" />
        </span>
        <div className="text-left">
          <div className="text-sm font-semibold text-neutral-900">Search</div>
          <div className="text-xs text-neutral-600">Anywhere 쨌 Any week 쨌 Guests</div>
        </div>
      </button>
    </div>
  );
}
