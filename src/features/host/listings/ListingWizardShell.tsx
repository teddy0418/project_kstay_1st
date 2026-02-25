"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useListingWizard } from "./ListingWizardContext";
import { WIZARD_STEPS, getStepIndex, isStepComplete, completedStepsCount } from "./wizard-steps";
import { Check } from "lucide-react";

const TOTAL_STEPS = WIZARD_STEPS.length;

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
  const { listing, saving, dirty, setDirty } = useListingWizard();
  const base = `/host/listings/new/${listingId}`;

  const currentSlug = pathname?.replace(base + "/", "").split("/")[0] ?? "";
  const stepIndex = getStepIndex(currentSlug);
  const completed = completedStepsCount(listing);
  const progressPct = TOTAL_STEPS > 0 ? Math.round((completed / TOTAL_STEPS) * 100) : 0;

  const handleStepClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string, isActive: boolean) => {
    if (!dirty || isActive) return;
    e.preventDefault();
    if (confirm("저장하지 않은 변경사항이 있습니다. 이동하면 사라질 수 있어요.")) {
      setDirty(false);
      router.push(href);
    }
  };

  return (
    <div className="mx-auto max-w-4xl p-6">
      {/* 진행률: N/7 단계 + 프로그레스 바 */}
      <div className="mb-4 flex items-center gap-3">
        <span className="text-sm font-medium text-neutral-600">
          {completed}/{TOTAL_STEPS} 단계 완료
        </span>
        <div className="flex-1 h-2 max-w-[200px] rounded-full bg-neutral-200 overflow-hidden">
          <div
            className="h-full rounded-full bg-green-500 transition-all duration-300"
            style={{ width: `${progressPct}%` }}
            role="progressbar"
            aria-valuenow={completed}
            aria-valuemin={0}
            aria-valuemax={TOTAL_STEPS}
          />
        </div>
      </div>

      {/* 상단 가로 스텝바: 모바일은 짧은 라벨로 한 줄, 데스크톱은 전체 라벨 */}
      <nav className="overflow-x-auto rounded-2xl border border-neutral-200 bg-white p-1.5 sm:p-2 shadow-sm">
        <ul className="flex min-w-max gap-0.5 sm:gap-1">
          {WIZARD_STEPS.map(({ slug, label, shortLabel }, i) => {
            const href = `${base}/${slug}`;
            const isActive = pathname === href || pathname?.startsWith(href + "/");
            const isPast = stepIndex >= 0 && i < stepIndex;
            const complete = isStepComplete(slug, listing);
            const isClickable = stepIndex >= 0 && i <= stepIndex;
            const baseClass =
              "flex items-center gap-1 rounded-lg px-2 py-2 sm:gap-1.5 sm:rounded-xl sm:px-3 sm:py-2.5 text-xs sm:text-sm font-medium transition whitespace-nowrap ";
            if (!isClickable) {
              return (
                <li key={slug}>
                  <span
                    className={
                      baseClass +
                      "cursor-not-allowed bg-neutral-50 text-neutral-400"
                    }
                    title="이전 단계를 완료하면 이동할 수 있습니다"
                  >
                    <span className="sm:hidden">{shortLabel}</span>
                    <span className="hidden sm:inline">{label}</span>
                  </span>
                </li>
              );
            }
            return (
              <li key={slug}>
                <Link
                  href={href}
                  onClick={(e) => handleStepClick(e, href, isActive)}
                  className={
                    baseClass +
                    (isActive
                      ? "bg-neutral-900 text-white"
                      : isPast || complete
                        ? "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
                        : "text-neutral-600 hover:bg-neutral-50")
                  }
                >
                  {(isPast || complete) && <Check className="h-3 w-3 shrink-0 text-green-600 sm:h-3.5 sm:w-3.5" />}
                  <span className="sm:hidden">{shortLabel}</span>
                  <span className="hidden sm:inline">{label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* 저장 상태 뱃지 + 잠금 안내 (저장 버튼은 각 단계 하단 '다음' 왼쪽에 있음) */}
      <div className="mt-4 flex flex-wrap items-center gap-3">
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

      <main className="mt-6">{children}</main>
    </div>
  );
}
