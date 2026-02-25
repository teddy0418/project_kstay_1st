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

type GeoResult = {
  label: string;
  address: string;
  lat: number;
  lng: number;
  city?: string;
  area?: string;
  stateProvince?: string;
  cityDistrict?: string;
  roadAddress?: string;
  zipCode?: string;
};

const LocationMap = dynamic(
  () => import("@/features/host/listings/LocationMap"),
  { ssr: false }
);

export default function WizardLocationPage() {
  const { listing, patch, isLocked, dirty, setDirty, performSaveRef, setSaving, saving, performSave } = useListingWizard();
  const { toast } = useToast();
  const router = useRouter();
  const [country, setCountry] = useState("South Korea");
  const [stateProvince, setStateProvince] = useState("");
  const [cityDistrict, setCityDistrict] = useState("");
  const [roadAddress, setRoadAddress] = useState("");
  const [detailedAddress, setDetailedAddress] = useState("");
  const [zipCode, setZipCode] = useState("");
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  // 하위 호환: city, area, address (공개용 표시 주소)
  const [city, setCity] = useState("");
  const [area, setArea] = useState("");
  const [address, setAddress] = useState("");

  const [suggestions, setSuggestions] = useState<GeoResult[]>([]);
  const [suggestLoading, setSuggestLoading] = useState(false);
  const [suggestOpen, setSuggestOpen] = useState(false);
  const suggestRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!listing) return;
    const L = listing as typeof listing & {
      country?: string | null;
      stateProvince?: string | null;
      cityDistrict?: string | null;
      roadAddress?: string | null;
      detailedAddress?: string | null;
      zipCode?: string | null;
    };
    setCountry(L.country ?? "South Korea");
    setStateProvince(L.stateProvince ?? "");
    setCityDistrict(L.cityDistrict ?? "");
    setRoadAddress(L.roadAddress ?? "");
    setDetailedAddress(L.detailedAddress ?? "");
    setZipCode(L.zipCode ?? "");
    setCity(listing.city ?? "");
    setArea(listing.area ?? "");
    setAddress(listing.address ?? "");
    setLat(listing.lat ?? null);
    setLng(listing.lng ?? null);
  }, [listing]);

  useEffect(() => {
    const q = roadAddress.trim();
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
  }, [roadAddress, toast]);

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
    setStateProvince(r.stateProvince ?? r.city ?? "");
    setCityDistrict(r.cityDistrict ?? r.area ?? "");
    setRoadAddress(r.roadAddress ?? r.address ?? "");
    setZipCode(r.zipCode ?? "");
    setCity(r.city ?? r.stateProvince ?? "");
    setArea(r.area ?? r.cityDistrict ?? "");
    setAddress(r.address ?? "");
    setLat(Number.isFinite(r.lat) ? r.lat : null);
    setLng(Number.isFinite(r.lng) ? r.lng : null);
    setSuggestions([]);
    setSuggestOpen(false);
    setDirty(true);
  }, [setDirty]);

  const save = useCallback(async () => {
    if (!listing || isLocked) return;
    setSaving(true);
    try {
      await patch({
        country: country.trim() || "KR",
        stateProvince: stateProvince.trim() || undefined,
        cityDistrict: cityDistrict.trim() || undefined,
        roadAddress: roadAddress.trim() || undefined,
        detailedAddress: detailedAddress.trim() || undefined,
        zipCode: zipCode.trim() || undefined,
        city: city.trim() || stateProvince.trim() || undefined,
        area: area.trim() || cityDistrict.trim() || undefined,
        address: address.trim() || roadAddress.trim() || undefined,
        lat: lat ?? undefined,
        lng: lng ?? undefined,
      });
      setDirty(false);
      toast("저장됨");
    } finally {
      setSaving(false);
    }
  }, [listing, isLocked, patch, country, stateProvince, cityDistrict, roadAddress, detailedAddress, zipCode, city, area, address, lat, lng, setDirty, setSaving, toast]);

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
          country: country.trim() || "KR",
          stateProvince: stateProvince.trim() || undefined,
          cityDistrict: cityDistrict.trim() || undefined,
          roadAddress: roadAddress.trim() || undefined,
          detailedAddress: detailedAddress.trim() || undefined,
          zipCode: zipCode.trim() || undefined,
          city: city.trim() || stateProvince.trim() || undefined,
          area: area.trim() || cityDistrict.trim() || undefined,
          address: address.trim() || roadAddress.trim() || undefined,
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
  }, [listing, dirty, country, stateProvince, cityDistrict, roadAddress, detailedAddress, zipCode, city, area, address, lat, lng, patch, setDirty, setSaving, router, toast]);

  const isPlaceholderAddress =
    address.trim() === "주소를 입력해 주세요" || !address.trim();
  const hasRealAddress =
    (address.trim().length > 0 && !isPlaceholderAddress) || roadAddress.trim().length > 0;
  const canGoNext = hasRealAddress && lat != null && lng != null;

  const onNextClick = useCallback(() => {
    if (!canGoNext) {
      toast("주소를 검색해 선택하고, 지도에서 위치를 확인해 주세요.");
      return;
    }
    void goNext();
  }, [canGoNext, goNext, toast]);

  if (!listing) return null;

  const mapLat = lat ?? DEFAULT_LAT;
  const mapLng = lng ?? DEFAULT_LNG;

  return (
    <div className="rounded-3xl border border-neutral-200 bg-white p-8 shadow-sm">
      <h2 className="text-xl font-semibold">위치</h2>
      <p className="mt-1 text-sm text-neutral-600">도로명 주소를 검색해 선택하면 해당 주소가 채워지고, 시/도·시/군/구·우편번호는 자동 입력됩니다.</p>

      <div className="mt-6 relative" ref={suggestRef}>
        <label className="text-sm font-medium text-neutral-700">도로명 주소 (주소 검색)</label>
        <p className="mt-1 text-xs text-neutral-500">검색 후 선택하면 시/도·시/군/구·우편번호가 자동으로 채워집니다.</p>
        <input
          value={roadAddress}
          onChange={(e) => {
            setDirty(true);
            setRoadAddress(e.target.value);
          }}
          disabled={isLocked}
          placeholder="도로명, 지번 또는 건물명 입력"
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

      <div className="mt-6 space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="text-sm font-medium text-neutral-700">시/도 (State/Province)</label>
            <input
              value={stateProvince}
              onChange={(e) => { setDirty(true); setStateProvince(e.target.value); }}
              disabled={isLocked}
              placeholder="Seoul, Busan, Gyeonggi-do 등"
              className="mt-2 w-full rounded-2xl border border-neutral-200 px-4 py-3 text-sm disabled:bg-neutral-50"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-neutral-700">시/군/구 (City/District)</label>
            <input
              value={cityDistrict}
              onChange={(e) => { setDirty(true); setCityDistrict(e.target.value); }}
              disabled={isLocked}
              placeholder="Mapo-gu, Jongno-gu 등"
              className="mt-2 w-full rounded-2xl border border-neutral-200 px-4 py-3 text-sm disabled:bg-neutral-50"
            />
          </div>
        </div>
        <div>
          <label className="text-sm font-medium text-neutral-700">상세 주소 (Detailed Address)</label>
          <p className="mt-1 text-xs text-neutral-500">예: 3층 301호. 게스트에게는 예약 확정 전까지 비공개됩니다.</p>
          <input
            value={detailedAddress}
            onChange={(e) => { setDirty(true); setDetailedAddress(e.target.value); }}
            disabled={isLocked}
            placeholder="예: 3층 301호"
            className="mt-2 w-full rounded-2xl border border-neutral-200 px-4 py-3 text-sm disabled:bg-neutral-50"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-neutral-700">우편번호 (Zip Code)</label>
          <input
            value={zipCode}
            onChange={(e) => { setDirty(true); setZipCode(e.target.value); }}
            disabled={isLocked}
            placeholder="예: 04050"
            className="mt-2 w-full max-w-[200px] rounded-2xl border border-neutral-200 px-4 py-3 text-sm disabled:bg-neutral-50"
          />
        </div>
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

      <div className="mt-8 flex justify-end gap-3">
        <button
          type="button"
          onClick={() => void performSave()}
          disabled={isLocked || !dirty || saving}
          className="rounded-2xl border border-neutral-200 bg-white px-6 py-3 text-sm font-medium text-neutral-900 hover:bg-neutral-50 disabled:opacity-50"
        >
          {saving ? "저장 중…" : "저장"}
        </button>
        <button
          type="button"
          onClick={onNextClick}
          disabled={isLocked}
          className="rounded-2xl bg-neutral-900 px-6 py-3 text-sm font-medium text-white hover:bg-neutral-800 disabled:opacity-50"
        >
          다음: 가격
        </button>
      </div>
    </div>
  );
}
