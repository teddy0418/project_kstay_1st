"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { Loader2 } from "lucide-react";
import { useListingWizard } from "@/features/host/listings/ListingWizardContext";
import { useToast } from "@/components/ui/ToastProvider";
import { apiClient, ApiClientError } from "@/lib/api/client";

const DEFAULT_LAT = 37.5665;
const DEFAULT_LNG = 126.978;
const ADDRESS_SEARCH_DEBOUNCE_MS = 300;

type GeoResult = { label: string; address: string; lat: number; lng: number; city?: string; area?: string };

const LocationMap = dynamic(
  () => import("@/features/host/listings/LocationMap"),
  { ssr: false }
);

export default function WizardLocationPage() {
  const { listing, patch, isLocked, dirty, setDirty, performSaveRef, setSaving } = useListingWizard();
  const { toast } = useToast();
  const router = useRouter();
  const [city, setCity] = useState("");
  const [area, setArea] = useState("");
  const [address, setAddress] = useState("");
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState<GeoResult[]>([]);
  const [suggestLoading, setSuggestLoading] = useState(false);
  const [suggestOpen, setSuggestOpen] = useState(false);
  const suggestRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!listing) return;
    setCity(listing.city ?? "");
    setArea(listing.area ?? "");
    setAddress(listing.address ?? "");
    setLat(listing.lat ?? null);
    setLng(listing.lng ?? null);
  }, [listing]);

  useEffect(() => {
    const q = searchQuery.trim();
    if (q.length < 2) {
      setSuggestions([]);
      setSuggestOpen(false);
      return;
    }
    const ac = new AbortController();
    const t = setTimeout(async () => {
      setSuggestLoading(true);
      try {
        const data = await apiClient.get<{ results: GeoResult[] }>(
          `/api/geo/autocomplete?q=${encodeURIComponent(q)}`,
          { signal: ac.signal }
        );
        if (ac.signal.aborted) return;
        const list = data?.results ?? [];
        setSuggestions(list);
        setSuggestOpen(list.length > 0);
      } catch (err) {
        if (ac.signal.aborted) return;
        setSuggestions([]);
        if (err instanceof ApiClientError && err.status === 429) {
          toast(err.message || "요청이 너무 많습니다. 잠시 후 다시 시도해 주세요.");
        }
      } finally {
        if (!ac.signal.aborted) setSuggestLoading(false);
      }
    }, ADDRESS_SEARCH_DEBOUNCE_MS);
    return () => {
      clearTimeout(t);
      ac.abort();
    };
  }, [searchQuery]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (suggestRef.current && !suggestRef.current.contains(e.target as Node)) {
        setSuggestOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const onSelectSuggestion = useCallback((r: GeoResult) => {
    setAddress(typeof r.address === "string" ? r.address : "");
    setCity(typeof r.city === "string" ? r.city : "");
    setArea(typeof r.area === "string" ? r.area : "");
    setLat(Number.isFinite(r.lat) ? r.lat : null);
    setLng(Number.isFinite(r.lng) ? r.lng : null);
    setSearchQuery("");
    setSuggestions([]);
    setSuggestOpen(false);
    setDirty(true);
  }, [setDirty]);

  const save = useCallback(async () => {
    if (!listing || isLocked) return;
    setSaving(true);
    try {
      await patch({
        city: city.trim() || undefined,
        area: area.trim() || undefined,
        address: address.trim() || undefined,
        lat: lat ?? undefined,
        lng: lng ?? undefined,
      });
      setDirty(false);
      toast("저장됨");
    } finally {
      setSaving(false);
    }
  }, [listing, isLocked, patch, city, area, address, lat, lng, setDirty, setSaving, toast]);

  useEffect(() => {
    performSaveRef.current = save;
    return () => {
      performSaveRef.current = null;
    };
  }, [performSaveRef, save]);

  const goNext = useCallback(async () => {
    if (!listing) return;
    if (dirty) {
      setSaving(true);
      try {
        await patch({
          city: city.trim() || undefined,
          area: area.trim() || undefined,
          address: address.trim() || undefined,
          lat: lat ?? undefined,
          lng: lng ?? undefined,
        });
        setDirty(false);
        router.push(`/host/listings/new/${listing.id}/pricing`);
      } catch {
        toast("저장에 실패했습니다.");
      } finally {
        setSaving(false);
      }
    } else {
      router.push(`/host/listings/new/${listing.id}/pricing`);
    }
  }, [listing, dirty, city, area, address, lat, lng, patch, setDirty, setSaving, router, toast]);

  if (!listing) return null;

  const mapLat = lat ?? DEFAULT_LAT;
  const mapLng = lng ?? DEFAULT_LNG;

  return (
    <div className="rounded-3xl border border-neutral-200 bg-white p-8 shadow-sm">
      <h2 className="text-xl font-semibold">위치</h2>
      <p className="mt-1 text-sm text-neutral-600">주소 검색 후 선택하거나, 직접 입력·지도에서 설정하세요.</p>

      <div className="mt-6 relative" ref={suggestRef}>
        <label className="text-sm font-medium text-neutral-700">주소 검색</label>
        <input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          disabled={isLocked}
          placeholder="주소 또는 건물명을 입력하세요"
          className="mt-2 w-full rounded-2xl border border-neutral-200 px-4 py-3 text-sm disabled:bg-neutral-50"
          autoComplete="off"
        />
        {suggestLoading && (
          <p className="mt-1 flex items-center gap-1.5 text-xs text-neutral-500" role="status" aria-live="polite">
            <Loader2 className="h-3.5 w-3.5 animate-spin shrink-0" />
            검색 중...
          </p>
        )}
        {suggestOpen && suggestions.length > 0 && (
          <ul className="absolute z-10 mt-1 w-full rounded-2xl border border-neutral-200 bg-white py-2 shadow-lg">
            {suggestions.map((r, i) => (
              <li key={i}>
                <button
                  type="button"
                  className="w-full px-4 py-2 text-left text-sm hover:bg-neutral-100"
                  onClick={() => onSelectSuggestion(r)}
                >
                  {r.label}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <p className="mt-6 text-xs text-neutral-500">
        도시·지역은 검색 결과에서 자동으로 채워집니다. 비어 있으면 직접 입력해 주세요.
      </p>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div>
          <label className="text-sm font-medium text-neutral-700">도시 (city)</label>
          <input
            value={city}
            onChange={(e) => { setDirty(true); setCity(e.target.value); }}
            disabled={isLocked}
            placeholder="Seoul"
            className="mt-2 w-full rounded-2xl border border-neutral-200 px-4 py-3 text-sm disabled:bg-neutral-50"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-neutral-700">지역/구 (area)</label>
          <input
            value={area}
            onChange={(e) => { setDirty(true); setArea(e.target.value); }}
            disabled={isLocked}
            placeholder="Jongno"
            className="mt-2 w-full rounded-2xl border border-neutral-200 px-4 py-3 text-sm disabled:bg-neutral-50"
          />
        </div>
      </div>
      <div className="mt-4">
        <label className="text-sm font-medium text-neutral-700">주소 (address)</label>
        <input
          value={address}
          onChange={(e) => { setDirty(true); setAddress(e.target.value); }}
          disabled={isLocked}
          placeholder="종로구 북촌로 123"
          className="mt-2 w-full rounded-2xl border border-neutral-200 px-4 py-3 text-sm disabled:bg-neutral-50"
        />
      </div>

      <div className="mt-6">
        <label className="text-sm font-medium text-neutral-700">지도에서 위치 선택 (클릭 시 마커 이동)</label>
        <div className="mt-2 h-64 w-full overflow-hidden rounded-2xl border border-neutral-200">
          <LocationMap
            lat={mapLat}
            lng={mapLng}
            disabled={isLocked}
            onSelect={(newLat, newLng) => {
              setDirty(true);
              setLat(newLat);
              setLng(newLng);
            }}
          />
        </div>
        <p className="mt-2 text-xs text-neutral-500">
          위도: {mapLat.toFixed(5)}, 경도: {mapLng.toFixed(5)}
        </p>
      </div>

      <div className="mt-8 flex justify-end">
        <button
          type="button"
          onClick={() => void goNext()}
          disabled={isLocked}
          className="rounded-2xl bg-neutral-900 px-6 py-3 text-sm font-medium text-white hover:bg-neutral-800 disabled:opacity-50"
        >
          다음: 가격
        </button>
      </div>
    </div>
  );
}
