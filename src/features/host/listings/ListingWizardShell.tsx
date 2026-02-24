"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useListingWizard } from "./ListingWizardContext";
import { Check } from "lucide-react";

const STEPS: { slug: string; label: string }[] = [
  { slug: "basics", label: "기본정보" },
  { slug: "location", label: "위치" },
  { slug: "pricing", label: "가격" },
  { slug: "amenities", label: "어메니티" },
  { slug: "guide", label: "안내 메시지" },
  { slug: "photos", label: "사진" },
  { slug: "review", label: "검토" },
];

export default function ListingWizardShell({
  listingId,
  children,
  isLocked,
}: {
  listingId: string;
  children: React.ReactNode;
  isLocked: boolean;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { performSave, saving, dirty, setDirty } = useListingWizard();
  const base = `/host/listings/new/${listingId}`;

  const handleStepClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string, isActive: boolean) => {
    if (!dirty || isActive) return;
    e.preventDefault();
    if (confirm("저장하지 않은 변경사항이 있습니다. 이동하면 사라질 수 있어요.")) {
      setDirty(false);
      router.push(href);
    }
  };

  const stepIndex = STEPS.findIndex((s) => pathname === `${base}/${s.slug}` || pathname?.startsWith(`${base}/${s.slug}/`));

  return (
    <div className="mx-auto max-w-4xl p-6">
      {/* 상단 가로 스텝바 */}
      <nav className="overflow-x-auto rounded-2xl border border-neutral-200 bg-white p-2 shadow-sm">
        <ul className="flex min-w-max gap-1">
          {STEPS.map(({ slug, label }, i) => {
            const href = `${base}/${slug}`;
            const isActive = pathname === href || pathname?.startsWith(href + "/");
            const isPast = stepIndex >= 0 && i < stepIndex;
            return (
              <li key={slug}>
                <Link
                  href={href}
                  onClick={(e) => handleStepClick(e, href, isActive)}
                  className={`flex items-center gap-1.5 rounded-xl px-3 py-2.5 text-sm font-medium transition whitespace-nowrap ${
                    isActive
                      ? "bg-neutral-900 text-white"
                      : isPast
                        ? "bg-neutral-100 text-neutral-600"
                        : "text-neutral-600 hover:bg-neutral-50"
                  }`}
                >
                  {isPast && <Check className="h-3.5 w-3.5 shrink-0" />}
                  <span>{label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* 저장 상태 뱃지 + 저장 버튼 + 잠금 안내 */}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          {isLocked && (
            <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
              상태가 DRAFT가 아니라 수정이 잠겨 있습니다.
            </p>
          )}
          {!isLocked && (
            <span
              className={`rounded-xl px-3 py-1.5 text-xs font-medium ${
                saving ? "bg-neutral-100 text-neutral-500" : dirty ? "bg-amber-100 text-amber-800" : "bg-neutral-100 text-neutral-600"
              }`}
              aria-live="polite"
            >
              {saving ? "저장 중…" : dirty ? "저장 필요" : "저장됨"}
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={() => void performSave?.()}
          disabled={isLocked || saving}
          className="rounded-2xl border border-neutral-200 bg-white px-5 py-2.5 text-sm font-medium text-neutral-900 hover:bg-neutral-50 disabled:opacity-50"
        >
          {saving ? "저장 중…" : "저장"}
        </button>
      </div>

      <main className="mt-6">{children}</main>
    </div>
  );
}
