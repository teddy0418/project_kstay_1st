"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, ChevronUp, Loader2 } from "lucide-react";
import { apiClient, ApiClientError } from "@/lib/api/client";
import { useToast } from "@/components/ui/ToastProvider";
import HostListingImagesUrlEditor from "@/features/host/listings/HostListingImagesUrlEditor";
import { AMENITY_CATEGORIES } from "@/lib/amenities";
import { AMENITY_ICONS } from "@/lib/amenity-icons";

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

type ListingImage = { id: string; url: string; sortOrder: number };

type Props = {
  listingId: string;
  initialTitle: string;
  initialTitleKo: string;
  initialHostBioKo: string;
  initialAddress: string;
  initialCity: string;
  initialArea: string;
  initialRoadAddress: string;
  initialLat: number | null;
  initialLng: number | null;
  initialCheckInTime: string;
  initialCheckOutTime: string;
  initialAmenities: string[];
  initialCheckInGuideMessage: string;
  initialHouseRulesMessage: string;
  initialDetailedAddress: string;
  initialImages: ListingImage[];
  canEditAddress: boolean;
};

const ADDRESS_DEBOUNCE_MS = 300;

export default function ApprovedListingEditForm({
  listingId,
  initialTitle,
  initialTitleKo,
  initialHostBioKo,
  initialAddress,
  initialCity,
  initialArea,
  initialRoadAddress,
  initialLat,
  initialLng,
  initialCheckInTime,
  initialCheckOutTime,
  initialAmenities,
  initialCheckInGuideMessage,
  initialHouseRulesMessage,
  initialDetailedAddress,
  initialImages,
  canEditAddress,
}: Props) {
  const router = useRouter();
  const { toast } = useToast();

  const [titleKo, setTitleKo] = useState(initialTitleKo || initialTitle || "");
  const [hostBioKo, setHostBioKo] = useState(initialHostBioKo ?? "");
  const [checkInTime, setCheckInTime] = useState(initialCheckInTime || "15:00");
  const [checkOutTime, setCheckOutTime] = useState(initialCheckOutTime || "11:00");
  const [amenitiesOpen, setAmenitiesOpen] = useState(false);
  const [amenities, setAmenities] = useState<Set<string>>(
    () => new Set(Array.isArray(initialAmenities) ? initialAmenities : [])
  );
  const [images, setImages] = useState<ListingImage[]>(initialImages);
  const [address, setAddress] = useState(initialAddress ?? "");
  const [city, setCity] = useState(initialCity ?? "");
  const [area, setArea] = useState(initialArea ?? "");
  const [roadAddress, setRoadAddress] = useState(initialRoadAddress ?? "");
  const [lat, setLat] = useState<number | null>(initialLat ?? null);
  const [lng, setLng] = useState<number | null>(initialLng ?? null);

  const initialConfirm = [initialCheckInGuideMessage.trim(), initialHouseRulesMessage.trim()]
    .filter(Boolean)
    .join("\n\n");
  const [confirmMessage, setConfirmMessage] = useState(initialConfirm);
  const [detailedAddress, setDetailedAddress] = useState(initialDetailedAddress);
  const [saving, setSaving] = useState(false);

  const [suggestions, setSuggestions] = useState<GeoResult[]>([]);
  const [suggestLoading, setSuggestLoading] = useState(false);
  const [suggestOpen, setSuggestOpen] = useState(false);
  const suggestRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!canEditAddress) return;
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
        setSuggestions(data?.results ?? []);
        setSuggestOpen((data?.results?.length ?? 0) > 0);
      } catch (err) {
        if (ac.signal.aborted) return;
        setSuggestions([]);
        if (err instanceof ApiClientError && err.status === 429) {
          toast(err.message || "요청이 너무 많습니다. 잠시 후 다시 시도해 주세요.");
        }
      } finally {
        if (!ac.signal.aborted) setSuggestLoading(false);
      }
    }, ADDRESS_DEBOUNCE_MS);
    return () => {
      clearTimeout(t);
      ac.abort();
    };
  }, [canEditAddress, roadAddress, toast]);

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
    setRoadAddress(r.roadAddress ?? r.address ?? "");
    setCity(r.city ?? r.stateProvince ?? "");
    setArea(r.area ?? r.cityDistrict ?? "");
    setAddress(r.address ?? "");
    setLat(Number.isFinite(r.lat) ? r.lat : null);
    setLng(Number.isFinite(r.lng) ? r.lng : null);
    setSuggestions([]);
    setSuggestOpen(false);
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const payload: Record<string, unknown> = {
        checkInGuideMessage: confirmMessage.trim() || null,
        houseRulesMessage: confirmMessage.trim() || null,
        detailedAddress: detailedAddress.trim() || null,
        titleKo: titleKo.trim() || null,
        hostBio: hostBioKo.trim() || null,
        hostBioKo: hostBioKo.trim() || null,
        checkInTime: checkInTime || "15:00",
        checkOutTime: checkOutTime || null,
        amenities: Array.from(amenities),
      };
      if (titleKo.trim().length >= 2) {
        payload.title = titleKo.trim();
      }
      if (canEditAddress) {
        payload.address = address.trim() || undefined;
        payload.city = city.trim() || undefined;
        payload.area = area.trim() || undefined;
        payload.roadAddress = roadAddress.trim() || undefined;
        payload.lat = lat ?? undefined;
        payload.lng = lng ?? undefined;
      }
      await apiClient.patch(`/api/host/listings/${listingId}`, payload);
      toast("저장되었습니다.");
      router.push("/host/listings");
    } catch (err) {
      toast(err instanceof Error ? err.message : "저장에 실패했습니다.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* 숙소 이름 */}
      <section>
        <h2 className="text-sm font-semibold text-neutral-800">숙소 이름</h2>
        <p className="mt-0.5 text-xs text-neutral-500">게스트에게 노출되는 제목입니다. 언제든 수정할 수 있습니다.</p>
        <input
          type="text"
          value={titleKo}
          onChange={(e) => setTitleKo(e.target.value)}
          placeholder="예: 한강뷰 감성 숙소"
          minLength={2}
          maxLength={200}
          className="mt-2 w-full rounded-xl border border-neutral-200 px-4 py-3 text-sm placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-400"
        />
      </section>

      {/* 숙소 설명 */}
      <section>
        <h2 className="text-sm font-semibold text-neutral-800">숙소 설명</h2>
        <p className="mt-0.5 text-xs text-neutral-500">상세페이지에 노출되는 설명입니다. 20자 이상 입력해 주세요.</p>
        <textarea
          value={hostBioKo}
          onChange={(e) => setHostBioKo(e.target.value)}
          placeholder="숙소의 분위기, 편의시설, 주변 정보 등을 소개해 주세요. (권장: 20자 이상)"
          rows={6}
          className="mt-2 w-full rounded-xl border border-neutral-200 px-4 py-3 text-sm placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-400"
        />
        <p className="mt-1 text-xs text-neutral-500">{hostBioKo.length}자</p>
      </section>

      {/* 체크인 / 체크아웃 */}
      <section>
        <h2 className="text-sm font-semibold text-neutral-800">체크인 · 체크아웃 시간</h2>
        <p className="mt-0.5 text-xs text-neutral-500">게스트에게 안내되는 시간입니다.</p>
        <div className="mt-2 flex flex-wrap gap-4 sm:gap-6">
          <div className="flex items-center gap-2">
            <label className="text-xs font-medium text-neutral-600">체크인</label>
            <input
              type="time"
              value={checkInTime}
              onChange={(e) => setCheckInTime(e.target.value)}
              className="rounded-lg border border-neutral-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-400"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs font-medium text-neutral-600">체크아웃</label>
            <input
              type="time"
              value={checkOutTime}
              onChange={(e) => setCheckOutTime(e.target.value)}
              className="rounded-lg border border-neutral-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-400"
            />
          </div>
        </div>
      </section>

      {/* 어메니티 (미니, 접이식) */}
      <section>
        <button
          type="button"
          onClick={() => setAmenitiesOpen((o) => !o)}
          className="flex w-full items-center justify-between rounded-xl border border-neutral-200 bg-neutral-50/50 px-4 py-3 text-left text-sm font-semibold text-neutral-800 hover:bg-neutral-50"
        >
          <span>편의시설 (어메니티)</span>
          <span className="flex items-center gap-1 text-xs font-normal text-neutral-500">
            {amenities.size}개 선택
            {amenitiesOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </span>
        </button>
        {amenitiesOpen && (
          <div className="mt-2 rounded-xl border border-neutral-200 bg-white p-3">
            <p className="mb-2 text-xs text-neutral-500">제공하는 편의시설을 선택하세요. (1개 이상)</p>
            <ul className="grid grid-cols-2 gap-1.5 sm:grid-cols-3 md:grid-cols-4">
              {AMENITY_CATEGORIES.flatMap((cat) =>
                cat.items.map((item) => {
                  const Icon = AMENITY_ICONS[item.key];
                  const isSelected = amenities.has(item.key);
                  return (
                    <li key={item.key}>
                      <label className="flex cursor-pointer items-center gap-2 rounded-lg border px-2.5 py-2 text-xs transition hover:bg-neutral-50">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => {
                            setAmenities((prev) => {
                              const next = new Set(prev);
                              if (next.has(item.key)) next.delete(item.key);
                              else next.add(item.key);
                              return next;
                            });
                          }}
                          className="h-3.5 w-3.5 rounded border-neutral-300"
                        />
                        {Icon && <Icon className="h-3.5 w-3.5 shrink-0 text-neutral-500" />}
                        <span className="truncate">{item.ko}</span>
                      </label>
                    </li>
                  );
                })
              )}
            </ul>
          </div>
        )}
      </section>

      {/* 사진 */}
      <section>
        <h2 className="text-sm font-semibold text-neutral-800">사진</h2>
        <p className="mt-0.5 text-xs text-neutral-500">추가·삭제·순서 변경은 즉시 반영됩니다. 최소 5장 이상 유지해 주세요.</p>
        <div className="mt-3">
          <HostListingImagesUrlEditor
            listingId={listingId}
            images={images}
            setImages={setImages}
            minCount={5}
            maxCount={20}
          />
        </div>
      </section>

      {/* 위치 */}
      <section>
        <h2 className="text-sm font-semibold text-neutral-800">위치</h2>
        {canEditAddress ? (
          <>
            <p className="mt-0.5 text-xs text-neutral-500">첫 예약을 받기 전에만 주소를 변경할 수 있습니다.</p>
            <div className="mt-3 relative" ref={suggestRef}>
              <label className="text-xs font-medium text-neutral-600">도로명 주소 검색</label>
              <input
                value={roadAddress}
                onChange={(e) => setRoadAddress(e.target.value)}
                placeholder="도로명, 지번 또는 건물명 입력"
                className="mt-1 w-full rounded-xl border border-neutral-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-400"
                autoComplete="off"
              />
              {suggestLoading && (
                <p className="mt-1 flex items-center gap-1.5 text-xs text-neutral-500">
                  <Loader2 className="h-3.5 w-3.5 animate-spin shrink-0" />
                  검색 중...
                </p>
              )}
              {suggestOpen && suggestions.length > 0 && (
                <ul className="absolute z-10 mt-1 w-full rounded-xl border border-neutral-200 bg-white py-2 shadow-lg">
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
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <div>
                <label className="text-xs font-medium text-neutral-600">시/도 · 시/군/구</label>
                <input
                  value={[city, area].filter(Boolean).join(" · ")}
                  readOnly
                  className="mt-1 w-full rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm text-neutral-600"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-neutral-600">표시 주소</label>
                <input
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="공개용 주소"
                  className="mt-1 w-full rounded-xl border border-neutral-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-400"
                />
              </div>
            </div>
            {lat != null && lng != null && (
              <p className="mt-2 text-xs text-neutral-500">위도: {lat.toFixed(5)}, 경도: {lng.toFixed(5)}</p>
            )}
          </>
        ) : (
          <>
            <p className="mt-1 text-sm text-amber-700">
              첫 예약 이후에는 주소를 변경할 수 없습니다. 변경이 필요하면 고객지원에 문의해 주세요.
            </p>
            <div className="mt-2 rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm text-neutral-700">
              {[initialCity, initialArea].filter(Boolean).join(" · ")}
              {initialAddress && ` · ${initialAddress}`}
            </div>
          </>
        )}
      </section>

      {/* 예약 확정 후 안내 */}
      <section>
        <h2 className="text-sm font-semibold text-neutral-800">예약 확정 후 전달 안내</h2>
        <p className="mt-0.5 text-xs text-neutral-500">체크인 방법, 이용 규칙 등을 예약 확정 후 게스트에게 전달합니다.</p>
        <textarea
          value={confirmMessage}
          onChange={(e) => setConfirmMessage(e.target.value)}
          placeholder="예: 현관 비밀번호, 키 보관함 위치, 주차 안내, 퇴실 시 정리 방법, 쓰레기 배출, 소음 안내 등"
          rows={6}
          className="mt-2 w-full rounded-xl border border-neutral-200 px-4 py-3 text-sm placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-400"
        />
      </section>

      <section>
        <label className="block text-sm font-medium text-neutral-700">상세 주소 (예약 확정 후 게스트에게 공개)</label>
        <p className="mt-0.5 text-xs text-neutral-500">동·호수 등</p>
        <input
          type="text"
          value={detailedAddress}
          onChange={(e) => setDetailedAddress(e.target.value)}
          placeholder="동·호수 등"
          className="mt-2 w-full rounded-xl border border-neutral-200 px-4 py-3 text-sm placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-400"
        />
      </section>

      <div className="flex justify-end gap-3 pt-4">
        <button
          type="button"
          onClick={() => router.push("/host/listings")}
          className="rounded-2xl border border-neutral-200 px-6 py-3 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
        >
          취소
        </button>
        <button
          type="submit"
          disabled={saving}
          className="rounded-2xl bg-neutral-900 px-6 py-3 text-sm font-medium text-white hover:bg-neutral-800 disabled:opacity-50"
        >
          {saving ? "저장 중…" : "저장"}
        </button>
      </div>
    </form>
  );
}
