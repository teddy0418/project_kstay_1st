"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import type { Listing } from "@/types";
import ListingCard from "@/features/listings/components/ListingCard";
import MapPanel from "@/features/map/components/MapPanel";
import ErrorBoundary from "@/components/ui/ErrorBoundary";
import type { ViewBounds } from "@/features/map/components/LeafletMap";
import { useCurrency } from "@/components/ui/CurrencyProvider";
import { useExchangeRates } from "@/components/ui/ExchangeRatesProvider";
import { totalGuestPriceKRW } from "@/lib/policy";
import { List, MapPin } from "lucide-react";
import { useI18n } from "@/components/ui/LanguageProvider";

const INITIAL_COUNT = 9;
const LOAD_MORE_STEP = 9;

function inBounds(l: Listing, b: ViewBounds) {
  return l.lat >= b.south && l.lat <= b.north && l.lng >= b.west && l.lng <= b.east;
}

function MapOverlay({
  showSearchArea,
  pendingBounds,
  areaBounds,
  onApplyAreaSearch,
  onClearAreaSearch,
}: {
  showSearchArea: boolean;
  pendingBounds: ViewBounds | null;
  areaBounds: ViewBounds | null;
  onApplyAreaSearch: () => void;
  onClearAreaSearch: () => void;
}) {
  return (
    <>
      {showSearchArea && pendingBounds && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[500]">
          <button
            type="button"
            onClick={onApplyAreaSearch}
            className="rounded-full bg-white px-4 py-2 text-sm font-semibold shadow-elevated border border-neutral-200 hover:bg-neutral-50"
          >
            Search this area
          </button>
        </div>
      )}

      {areaBounds && (
        <div className="absolute bottom-4 left-4 z-[500]">
          <button
            type="button"
            onClick={onClearAreaSearch}
            className="rounded-full bg-white px-4 py-2 text-xs font-semibold shadow-soft border border-neutral-200 hover:bg-neutral-50"
          >
            Clear area filter
          </button>
        </div>
      )}
    </>
  );
}

type MobileView = "list" | "map";

export default function BrowseMapLayout({ items }: { items: Listing[] }) {
  const router = useRouter();
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [mobileView, setMobileView] = useState<MobileView>("list");
  const [useTabLayout, setUseTabLayout] = useState<boolean>(true);
  const [isNarrow, setIsNarrow] = useState(true);
  const { currency } = useCurrency();
  const { formatFromKRW } = useExchangeRates();
  const { t } = useI18n();
  const [visibleCount, setVisibleCount] = useState(INITIAL_COUNT);

  useEffect(() => {
    const isMobileUA = () => {
      if (typeof navigator === "undefined" || !navigator.userAgent) return false;
      const ua = navigator.userAgent.toLowerCase();
      return /iphone|ipad|ipod|android|webos|mobile|blackberry|iemobile|opera mini/i.test(ua);
    };
    const update = () => {
      if (typeof window === "undefined") return;
      const w = window.innerWidth;
      const touch = "ontouchstart" in window || navigator.maxTouchPoints > 0;
      const mobileUA = isMobileUA();
      setUseTabLayout(w < 1920 || touch || mobileUA);
      setIsNarrow(w < 1024);
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  const [pendingBounds, setPendingBounds] = useState<ViewBounds | null>(null);
  const [areaBounds, setAreaBounds] = useState<ViewBounds | null>(null);
  const [showSearchArea, setShowSearchArea] = useState(false);

  const displayed = useMemo(() => {
    if (!areaBounds) return items;
    return items.filter((l) => inBounds(l, areaBounds));
  }, [items, areaBounds]);

  const visibleListings = useMemo(() => displayed.slice(0, visibleCount), [displayed, visibleCount]);
  const hasMore = visibleCount < displayed.length;

  useEffect(() => {
    setVisibleCount((prev) => Math.min(prev, displayed.length));
  }, [displayed.length]);

  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    if (!hoveredId) return;
    if (!displayed.some((x) => x.id === hoveredId)) {
      queueMicrotask(() => setHoveredId(null));
    }
  }, [displayed, hoveredId]);

  useEffect(() => {
    if (!selectedId) return;
    if (!displayed.some((x) => x.id === selectedId)) {
      setSelectedId(null);
    }
  }, [displayed, selectedId]);

  const onMarkerClick = (id: string) => {
    setHoveredId(id);
    setSelectedId(id);
    if (typeof window !== "undefined" && window.innerWidth < 1920) return;
    const el = document.getElementById(`card-${id}`);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  const onHoverChange = useCallback((id: string | null) => {
    setHoveredId(id);
  }, []);

  const selectedListing = useMemo(
    () => displayed.find((item) => item.id === selectedId) ?? null,
    [displayed, selectedId]
  );

  const applyAreaSearch = () => {
    if (!pendingBounds) return;
    setAreaBounds(pendingBounds);
    setShowSearchArea(false);
  };

  const clearAreaSearch = () => {
    setAreaBounds(null);
    setShowSearchArea(false);
  };

  const mapProps = {
    items: displayed,
    hoveredId,
    selectedId,
    onHoverChange,
    onMarkerClick,
    onBoundsChange: (b: ViewBounds) => setPendingBounds(b),
    onUserMoved: () => setShowSearchArea(true),
  };

  const onMarkerClickMobile = (id: string) => {
    setHoveredId(id);
    setSelectedId(id);
  };

  const gridStyle: React.CSSProperties = {
    display: "grid",
    gap: "1.5rem",
    gridTemplateColumns: useTabLayout ? "1fr" : "minmax(0,1fr) 520px",
  };

  return (
    <div style={gridStyle}>
      {/* 목록/지도 탭 – JS만으로 표시 제어 (Tailwind breakpoint 미사용, 배포/캐시 영향 없음) */}
      <div
        className="flex flex-col min-h-0"
        style={useTabLayout ? { display: "flex" } : { display: "none" }}
      >
        {/* Tab: 목록 | 지도 – relative z-20 so tabs stay above map (Leaflet has high z-index) */}
        <div className="relative z-20 flex shrink-0 rounded-xl bg-neutral-100 p-1 mb-4">
          <button
            type="button"
            onClick={() => setMobileView("list")}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition cursor-pointer touch-manipulation ${mobileView === "list" ? "bg-white text-neutral-900 shadow-sm" : "text-neutral-600"}`}
          >
            <List className="h-4 w-4 shrink-0" />
            {t("tab_list")}
          </button>
          <button
            type="button"
            onClick={() => {
              setMobileView("map");
              if (!hoveredId && displayed[0]) setHoveredId(displayed[0].id);
            }}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition cursor-pointer touch-manipulation ${mobileView === "map" ? "bg-white text-neutral-900 shadow-sm" : "text-neutral-600"}`}
          >
            <MapPin className="h-4 w-4 shrink-0" />
            {t("tab_map")}
          </button>
        </div>

        {mobileView === "list" ? (
          /* List only – easy to scroll (2nd image style), 9개씩 더보기 */
          <div className="min-w-0 flex-1">
            {displayed.length === 0 ? (
              <div className="rounded-2xl border border-neutral-200 p-10 text-center">
                <div className="text-lg font-semibold">No stays in this area</div>
                <p className="mt-2 text-sm text-neutral-600">
                  Move the map and try &quot;Search this area&quot;, or clear the area filter.
                </p>
              </div>
            ) : (
              <>
                <div className="grid gap-x-6 gap-y-10 sm:grid-cols-2">
                  {visibleListings.map((l) => (
                    <ListingCard
                      key={l.id}
                      listing={l}
                      active={hoveredId === l.id}
                      onHoverChange={setHoveredId}
                    />
                  ))}
                </div>
                {hasMore && (
                  <div className="mt-10 flex justify-center">
                    <button
                      type="button"
                      onClick={() => setVisibleCount((prev) => Math.min(prev + LOAD_MORE_STEP, displayed.length))}
                      className="inline-flex items-center justify-center rounded-xl bg-neutral-900 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:opacity-95 active:scale-[0.98]"
                    >
                      {t("load_more")}
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        ) : (
          /* Map view – 지도는 항상 펼친 상태 */
          <div className="relative z-0 flex-1 min-h-0 flex flex-col rounded-2xl border border-neutral-200 bg-white overflow-hidden">
            <div
              className="relative flex-1 min-h-0 rounded-2xl overflow-hidden bg-neutral-100"
              style={isNarrow ? { height: "55vh", minHeight: 200 } : { minHeight: "70vh" }}
            >
              <MapOverlay
                showSearchArea={showSearchArea}
                pendingBounds={pendingBounds}
                areaBounds={areaBounds}
                onApplyAreaSearch={applyAreaSearch}
                onClearAreaSearch={clearAreaSearch}
              />
              <ErrorBoundary
                fallback={
                  <div className="h-full w-full grid place-items-center text-sm text-neutral-600">
                    Map failed to load. (Check browser console)
                  </div>
                }
              >
                <MapPanel {...mapProps} onMarkerClick={onMarkerClickMobile} />
              </ErrorBoundary>
              {/* Bottom card overlay – 클릭 시 상세 이동 (router.push) */}
              {selectedListing ? (
              <div className="absolute inset-x-3 bottom-3 z-[1000] pointer-events-auto">
                <button
                  type="button"
                  onClick={() => router.push(`/listings/${String(selectedListing.id)}`)}
                  className="w-full text-left block rounded-2xl border border-neutral-200 bg-white p-3 shadow-elevated cursor-pointer hover:bg-neutral-50 active:bg-neutral-100 transition"
                >
                  <div className="flex gap-3">
                    <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-neutral-100">
                      {selectedListing.images[0] ? (
                        <Image
                          src={selectedListing.images[0]}
                          alt={selectedListing.title}
                          fill
                          className="object-cover"
                          sizes="80px"
                        />
                      ) : null}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-xs text-neutral-500">{selectedListing.location}</div>
                      <div className="mt-1 truncate text-sm font-semibold leading-5">{selectedListing.title}</div>
                      <div className="mt-2 text-sm font-semibold">
                        {formatFromKRW(totalGuestPriceKRW(selectedListing.pricePerNightKRW), currency)}
                        <span className="ml-1 font-normal text-neutral-500">/ night</span>
                      </div>
                    </div>
                  </div>
                </button>
              </div>
            ) : (
              <div className="absolute inset-x-3 bottom-3 z-[600] pointer-events-none">
                <p className="rounded-xl bg-white/90 backdrop-blur px-3 py-2 text-xs text-neutral-600 shadow-sm">
                  {t("browse_map_hint")}
                </p>
              </div>
            )}
            </div>
          </div>
        )}
      </div>

      {/* Desktop: List */}
      <div
        className="min-w-0"
        style={useTabLayout ? { display: "none" } : { display: "block" }}
      >
        {displayed.length === 0 ? (
          <div className="rounded-2xl border border-neutral-200 p-10 text-center">
            <div className="text-lg font-semibold">No stays in this area</div>
            <p className="mt-2 text-sm text-neutral-600">
              Move the map and try &quot;Search this area&quot;, or clear the area filter.
            </p>
          </div>
        ) : (
          <>
            <div className="grid gap-x-6 gap-y-10 sm:grid-cols-2 xl:grid-cols-2">
              {visibleListings.map((l) => (
                <ListingCard
                  key={l.id}
                  listing={l}
                  active={hoveredId === l.id}
                  onHoverChange={setHoveredId}
                />
              ))}
            </div>
            {hasMore && (
              <div className="mt-10 flex justify-center">
                <button
                  type="button"
                  onClick={() => setVisibleCount((prev) => Math.min(prev + LOAD_MORE_STEP, displayed.length))}
                  className="inline-flex items-center justify-center rounded-xl bg-neutral-900 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:opacity-95 active:scale-[0.98]"
                >
                  {t("load_more")}
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Desktop map (right sticky) – 지도는 항상 펼친 상태 */}
      <div style={useTabLayout ? { display: "none" } : { display: "block" }}>
        <div className={`relative rounded-2xl border border-neutral-200 bg-white overflow-hidden ${isNarrow ? "" : "sticky top-[132px] h-[calc(100vh-132px-24px)]"}`}>
          <div
            className="relative overflow-hidden bg-neutral-100 rounded-2xl"
            style={isNarrow ? { height: "50vh", minHeight: 240 } : { height: "100%" }}
          >
            <MapOverlay
              showSearchArea={showSearchArea}
              pendingBounds={pendingBounds}
              areaBounds={areaBounds}
              onApplyAreaSearch={applyAreaSearch}
              onClearAreaSearch={clearAreaSearch}
            />
            <ErrorBoundary
              fallback={
                <div className="h-full w-full grid place-items-center text-sm text-neutral-600">
                  Map failed to load. (Check browser console)
                </div>
              }
            >
              <MapPanel {...mapProps} />
            </ErrorBoundary>
          </div>
        </div>
      </div>
    </div>
  );
}
