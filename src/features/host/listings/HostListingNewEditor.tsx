"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn, useSession } from "next-auth/react";
import HostListingImagesUrlEditor from "./HostListingImagesUrlEditor";
import { useToast } from "@/components/ui/ToastProvider";

import { apiClient, ApiClientError } from "@/lib/api/client";

type ListingStatus = "DRAFT" | "PENDING" | "APPROVED" | "REJECTED";

type ListingCreateRes = { id: string; status: ListingStatus };
type ListingPatchRes = {
  id: string;
  title?: string | null;
  city?: string | null;
  area?: string | null;
  address?: string | null;
  basePriceKrw?: number | null;
  status: ListingStatus;
};

type ListingImage = { id: string; url: string; sortOrder: number };

type Lang = "en" | "ko" | "ja" | "zh";

type FormState = {
  title: string;
  titleKo: string;
  titleJa: string;
  titleZh: string;

  city: string;
  area: string;
  address: string;

  basePriceKrw: string;

  checkInTime: string;
  checkOutTime: string;

  hostBio: string;
  hostBioKo: string;
  hostBioJa: string;
  hostBioZh: string;
};

const EMPTY_FORM: FormState = {
  title: "",
  titleKo: "",
  titleJa: "",
  titleZh: "",

  city: "",
  area: "",
  address: "",

  basePriceKrw: "",

  checkInTime: "",
  checkOutTime: "",

  hostBio: "",
  hostBioKo: "",
  hostBioJa: "",
  hostBioZh: "",
};

function isApiClientError(err: unknown): err is ApiClientError {
  return err instanceof ApiClientError;
}

function parsePriceInt(v: string): number | undefined {
  const raw = v.replace(/,/g, "").trim();
  if (!raw) return undefined;
  const n = Number(raw);
  if (!Number.isFinite(n)) return undefined;
  return Math.max(0, Math.floor(n));
}

function pickBestTitle(form: FormState): string {
  return (
    form.title.trim() ||
    form.titleKo.trim() ||
    form.titleJa.trim() ||
    form.titleZh.trim() ||
    ""
  );
}

function buildCreatePayload(form: FormState, status: "DRAFT" | "PENDING") {
  const basePriceKrw = parsePriceInt(form.basePriceKrw);
  const payload: Record<string, unknown> = {
    status,
    title: pickBestTitle(form),

    titleKo: form.titleKo.trim() || undefined,
    titleJa: form.titleJa.trim() || undefined,
    titleZh: form.titleZh.trim() || undefined,

    city: form.city.trim() || undefined,
    area: form.area.trim() || undefined,
    address: form.address.trim() || undefined,

    basePriceKrw: basePriceKrw,

    checkInTime: form.checkInTime || undefined,
    checkOutTime: form.checkOutTime || undefined,

    hostBio: form.hostBio.trim() || undefined,
    hostBioKo: form.hostBioKo.trim() || undefined,
    hostBioJa: form.hostBioJa.trim() || undefined,
    hostBioZh: form.hostBioZh.trim() || undefined,
  };

  Object.keys(payload).forEach((k) => payload[k] === undefined && delete payload[k]);
  return payload;
}

function buildPatchPayload(form: FormState, includeTimeFields: boolean) {
  const basePriceKrw = parsePriceInt(form.basePriceKrw);

  const payload: Record<string, unknown> = {
    title: pickBestTitle(form),

    titleKo: form.titleKo.trim() || undefined,
    titleJa: form.titleJa.trim() || undefined,
    titleZh: form.titleZh.trim() || undefined,

    city: form.city.trim() || undefined,
    area: form.area.trim() || undefined,
    address: form.address.trim() || undefined,

    basePriceKrw: basePriceKrw,

    ...(includeTimeFields ? {
      checkInTime: form.checkInTime || undefined,
      checkOutTime: form.checkOutTime || undefined,
    } : {}),

    hostBio: form.hostBio.trim() || undefined,
    hostBioKo: form.hostBioKo.trim() || undefined,
    hostBioJa: form.hostBioJa.trim() || undefined,
    hostBioZh: form.hostBioZh.trim() || undefined,
  };

  Object.keys(payload).forEach((k) => payload[k] === undefined && delete payload[k]);
  return payload;
}

function storageKey(listingId: string | null) {
  return listingId ? `kstay_host_listing_new_${listingId}` : "kstay_host_listing_new_draft";
}

export default function HostListingNewEditor() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { update: updateSession } = useSession();
  const { toast } = useToast();


  const initialId = searchParams.get("id");
  const [listingId, setListingId] = useState<string | null>(initialId);
  const [status, setStatus] = useState<ListingStatus>("DRAFT");

  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [images, setImages] = useState<ListingImage[]>([]);

  const [activeTitleLang, setActiveTitleLang] = useState<Lang>("ko");
  const [activeBioLang, setActiveBioLang] = useState<Lang>("ko");

  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [dirty, setDirty] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [patchSupportsTimeFields, setPatchSupportsTimeFields] = useState(true);
  const [loadState, setLoadState] = useState<"idle" | "loading" | "loaded" | "error">("idle");

  const savingRef = useRef(false);
  const loadedIdRef = useRef<string | null>(null);

  useEffect(() => {
    try {
      const key = storageKey(listingId);
      localStorage.setItem(key, JSON.stringify({ form, images, status, listingId }));
    } catch {
      // ignore
    }
  }, [form, images, status, listingId]);

  // 편집 모드: ?id= 있으면 GET으로 서버에서 로딩
  useEffect(() => {
    const id = searchParams.get("id");
    if (!id || loadedIdRef.current === id) return;

    loadedIdRef.current = id;
    setLoadState("loading");
    setError(null);

    apiClient
      .get<{
        id: string;
        status: ListingStatus;
        title: string | null;
        titleKo: string | null;
        titleJa: string | null;
        titleZh: string | null;
        city: string;
        area: string;
        address: string;
        basePriceKrw: number;
        checkInTime: string | null;
        checkOutTime: string | null;
        hostBio: string | null;
        hostBioKo: string | null;
        hostBioJa: string | null;
        hostBioZh: string | null;
        images: { id: string; url: string; sortOrder: number }[];
      }>(`/api/host/listings/${id}`)
      .then((listing) => {
        const imgs = (listing?.images ?? []).slice().sort((a, b) => a.sortOrder - b.sortOrder);
        setListingId(listing.id);
        setStatus(listing.status ?? "DRAFT");
        setForm({
          title: listing.title ?? "",
          titleKo: listing.titleKo ?? "",
          titleJa: listing.titleJa ?? "",
          titleZh: listing.titleZh ?? "",
          city: listing.city ?? "",
          area: listing.area ?? "",
          address: listing.address ?? "",
          basePriceKrw: listing.basePriceKrw != null ? String(listing.basePriceKrw) : "",
          checkInTime: listing.checkInTime ?? "15:00",
          checkOutTime: listing.checkOutTime ?? "11:00",
          hostBio: listing.hostBio ?? "",
          hostBioKo: listing.hostBioKo ?? "",
          hostBioJa: listing.hostBioJa ?? "",
          hostBioZh: listing.hostBioZh ?? "",
        });
        setImages(imgs);
        setLoadState("loaded");
        setDirty(false);
      })
      .catch((e: unknown) => {
        setLoadState("error");
        const msg = isApiClientError(e) ? (e as { message?: string }).message : "불러오기 실패";
        setError(msg ?? "불러오기 실패");
        notify(msg ?? "불러오기 실패");
      });
  }, [searchParams]);

  // 신규 모드만: URL에 id 없을 때만 localStorage 복구
  useEffect(() => {
    if (searchParams.get("id")) return;
    try {
      const key = storageKey(listingId);
      const raw = localStorage.getItem(key);
      if (!raw) return;
      const parsed = JSON.parse(raw) as { form?: FormState; images?: ListingImage[]; status?: ListingStatus };
      if (parsed?.form) setForm(parsed.form);
      if (Array.isArray(parsed?.images)) setImages(parsed.images);
      if (parsed?.status) setStatus(parsed.status);
    } catch {
      // ignore
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!listingId) return;
    const current = searchParams.get("id");
    if (current === listingId) return;
    router.replace(`/host/listings/new?id=${listingId}`);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listingId]);

  useEffect(() => {
    if (!listingId) return;
    if (status !== "DRAFT") return;
    if (!dirty) return;

    const t = setTimeout(() => {
      void saveNow(true);
    }, 800);

    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form, listingId, status, dirty]);

  function notify(msg: string) {
    try {
      toast(msg);
    } catch {
      // ignore
    }
  }

  function setField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setDirty(true);
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function titleValueForLang(lang: Lang) {
    if (lang === "en") return form.title;
    if (lang === "ko") return form.titleKo;
    if (lang === "ja") return form.titleJa;
    return form.titleZh;
  }

  function setTitleForLang(lang: Lang, v: string) {
    if (lang === "en") return setField("title", v);
    if (lang === "ko") return setField("titleKo", v);
    if (lang === "ja") return setField("titleJa", v);
    return setField("titleZh", v);
  }

  function bioValueForLang(lang: Lang) {
    if (lang === "en") return form.hostBio;
    if (lang === "ko") return form.hostBioKo;
    if (lang === "ja") return form.hostBioJa;
    return form.hostBioZh;
  }

  function setBioForLang(lang: Lang, v: string) {
    if (lang === "en") return setField("hostBio", v);
    if (lang === "ko") return setField("hostBioKo", v);
    if (lang === "ja") return setField("hostBioJa", v);
    return setField("hostBioZh", v);
  }

  async function ensureSignedInIf401(err: unknown) {
    if (!isApiClientError(err)) return;
    const statusCode = (err as { status?: number }).status;
    if (statusCode === 401) {
      notify("로그인이 필요합니다. 로그인 화면으로 이동합니다.");
      await signIn();
    }
  }

  async function createDraftOrPending(nextStatus: "DRAFT" | "PENDING") {
    setSaveState("saving");
    setError(null);

    try {
      const payload = buildCreatePayload(form, nextStatus);

      const res = await apiClient.post(`/api/host/listings`, payload);
      const data: ListingCreateRes = (res && typeof res === "object" && "data" in res ? (res as { data: ListingCreateRes }).data : res) as ListingCreateRes;

      if (!data?.id) throw new Error("생성 응답에 id가 없습니다.");

      setListingId(data.id);
      setStatus(data.status ?? nextStatus);
      setDirty(false);
      setSaveState("saved");

      try {
        await updateSession?.();
      } catch {
        // ignore
      }

      notify("초안이 저장되었습니다. 이제부터는 자동 저장됩니다.");
      router.refresh();

      return data.id;
    } catch (e: unknown) {
      setSaveState("error");
      setError(e instanceof Error ? e.message : "초안 생성 실패");
      await ensureSignedInIf401(e);
      return null;
    }
  }

  async function patchListing(id: string, payload: Record<string, unknown>) {
    const res = await apiClient.patch(`/api/host/listings/${id}`, payload);
    const data: ListingPatchRes = (res && typeof res === "object" && "data" in res ? (res as { data: ListingPatchRes }).data : res) as ListingPatchRes;
    if (data?.status) setStatus(data.status);
    return data;
  }

  async function saveNow(silent: boolean) {
    if (savingRef.current) return;
    savingRef.current = true;

    setSaveState("saving");
    setError(null);

    try {
      if (!listingId) {
        const newId = await createDraftOrPending("DRAFT");
        if (!newId) return;
      }

      const id = listingId || searchParams.get("id");
      if (!id) return;

      const payload1 = buildPatchPayload(form, patchSupportsTimeFields);

      if (Object.keys(payload1).length === 0) {
        setDirty(false);
        setSaveState("saved");
        return;
      }

      try {
        await patchListing(id, payload1);
      } catch (e: unknown) {
        if (patchSupportsTimeFields && isApiClientError(e) && (e as { status?: number }).status === 400) {
          setPatchSupportsTimeFields(false);
          const payload2 = buildPatchPayload(form, false);
          await patchListing(id, payload2);
        } else {
          throw e;
        }
      }

      setDirty(false);
      setSaveState("saved");
      if (!silent) notify("저장되었습니다.");
    } catch (e: unknown) {
      setSaveState("error");
      setError(e instanceof Error ? e.message : "저장 실패");
      await ensureSignedInIf401(e);
    } finally {
      savingRef.current = false;
    }
  }

  async function requestReview() {
    await saveNow(false);

    const id = listingId || searchParams.get("id");
    if (!id) return;

    setSaveState("saving");
    setError(null);

    try {
      const res = await apiClient.patch(`/api/host/listings/${id}`, { status: "PENDING" });
      const data: ListingPatchRes = (res && typeof res === "object" && "data" in res ? (res as { data: ListingPatchRes }).data : res) as ListingPatchRes;

      setStatus(data.status ?? "PENDING");
      setSaveState("saved");
      notify("검토 요청이 완료되었습니다. (PENDING)");
      router.refresh();
    } catch (e: unknown) {
      setSaveState("error");
      setError(e instanceof Error ? e.message : "검토 요청 실패");
      await ensureSignedInIf401(e);
    }
  }

  const isLocked = status !== "DRAFT";

  if (loadState === "loading") {
    return (
      <div className="mx-auto max-w-4xl p-6">
        <div className="rounded-3xl border border-neutral-200 bg-white p-12 shadow-sm text-center text-neutral-600">
          불러오는 중…
        </div>
      </div>
    );
  }

  const canRequestReview = useMemo(() => {
    const price = parsePriceInt(form.basePriceKrw) ?? 0;
    const hasAnyTitle = !!pickBestTitle(form).trim();
    const hasLocation = !!form.city.trim() && !!form.area.trim() && !!form.address.trim();
    return hasAnyTitle && hasLocation && price > 0;
  }, [form]);

  return (
    <div className="mx-auto max-w-4xl p-6">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">신규 숙소 등록</h1>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-neutral-600">
            <span className="rounded-full border border-neutral-200 px-3 py-1">
              상태: <b className="text-neutral-900">{status}</b>
            </span>
            <span className="rounded-full border border-neutral-200 px-3 py-1">
              저장:{" "}
              <b className="text-neutral-900">
                {saveState === "saving"
                  ? "저장 중…"
                  : saveState === "saved"
                    ? "저장됨"
                    : saveState === "error"
                      ? "오류"
                      : "대기"}
              </b>
            </span>
            {listingId && (
              <span className="rounded-full border border-neutral-200 px-3 py-1">
                listingId: <b className="text-neutral-900">{listingId}</b>
              </span>
            )}
          </div>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => void saveNow(false)}
            disabled={isLocked && !!listingId}
            className="rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm font-medium text-neutral-900 shadow-sm disabled:opacity-50"
          >
            {listingId ? "지금 저장" : "초안 저장"}
          </button>

          <button
            type="button"
            onClick={() => void requestReview()}
            disabled={!canRequestReview}
            className="rounded-2xl bg-neutral-900 px-4 py-3 text-sm font-medium text-white hover:bg-neutral-800 disabled:opacity-50"
          >
            검토 요청(PENDING)
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-6 rounded-3xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">
          {error}
        </div>
      )}

      {isLocked && (
        <div className="mb-6 rounded-3xl border border-neutral-200 bg-neutral-50 p-5 text-sm text-neutral-700">
          현재 상태가 <b>{status}</b>라서 입력이 잠겨있습니다. (필요하면 잠금 정책은 바꿀 수 있어요)
        </div>
      )}

      <section className="rounded-3xl border border-neutral-200 bg-white p-8 shadow-sm">
        <h2 className="text-lg font-semibold">제목</h2>
        <p className="mt-1 text-sm text-neutral-600">
          EN/KO/JA/ZH 중 하나라도 입력하면 됩니다. (title 무접미는 비어있으면 자동으로 다른 언어 값을 사용해 전송합니다)
        </p>

        <div className="mt-4 flex flex-wrap gap-2">
          {(["en", "ko", "ja", "zh"] as Lang[]).map((lang) => (
            <button
              key={lang}
              type="button"
              onClick={() => setActiveTitleLang(lang)}
              className={`rounded-2xl border px-4 py-2 text-sm ${
                activeTitleLang === lang
                  ? "border-neutral-900 bg-neutral-900 text-white"
                  : "border-neutral-200 bg-white text-neutral-900"
              }`}
            >
              {lang.toUpperCase()}
            </button>
          ))}
        </div>

        <input
          value={titleValueForLang(activeTitleLang)}
          onChange={(e) => setTitleForLang(activeTitleLang, e.target.value)}
          disabled={isLocked}
          placeholder="예: 서울 한옥 스테이"
          className="mt-4 w-full rounded-2xl border border-neutral-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900/10 disabled:bg-neutral-50"
        />
      </section>

      <section className="mt-6 rounded-3xl border border-neutral-200 bg-white p-8 shadow-sm">
        <h2 className="text-lg font-semibold">위치</h2>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <label className="text-sm text-neutral-700">도시 (city)</label>
            <input
              value={form.city}
              onChange={(e) => setField("city", e.target.value)}
              disabled={isLocked}
              placeholder="Seoul"
              className="mt-2 w-full rounded-2xl border border-neutral-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900/10 disabled:bg-neutral-50"
            />
          </div>

          <div>
            <label className="text-sm text-neutral-700">지역/구 (area)</label>
            <input
              value={form.area}
              onChange={(e) => setField("area", e.target.value)}
              disabled={isLocked}
              placeholder="Jongno"
              className="mt-2 w-full rounded-2xl border border-neutral-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900/10 disabled:bg-neutral-50"
            />
          </div>
        </div>

        <div className="mt-4">
          <label className="text-sm text-neutral-700">주소 (address)</label>
          <input
            value={form.address}
            onChange={(e) => setField("address", e.target.value)}
            disabled={isLocked}
            placeholder="종로구 북촌로 123"
            className="mt-2 w-full rounded-2xl border border-neutral-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900/10 disabled:bg-neutral-50"
          />
        </div>
      </section>

      <section className="mt-6 rounded-3xl border border-neutral-200 bg-white p-8 shadow-sm">
        <h2 className="text-lg font-semibold">가격 & 체크인</h2>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <label className="text-sm text-neutral-700">1박 기준가 (basePriceKrw)</label>
            <input
              inputMode="numeric"
              value={form.basePriceKrw}
              onChange={(e) => setField("basePriceKrw", e.target.value.replace(/[^\d,]/g, ""))}
              disabled={isLocked}
              placeholder="120000"
              className="mt-2 w-full rounded-2xl border border-neutral-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900/10 disabled:bg-neutral-50"
            />
          </div>

          <div>
            <label className="text-sm text-neutral-700">체크인 (checkInTime)</label>
            <input
              type="time"
              value={form.checkInTime}
              onChange={(e) => setField("checkInTime", e.target.value)}
              disabled={isLocked}
              className="mt-2 w-full rounded-2xl border border-neutral-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900/10 disabled:bg-neutral-50"
            />
          </div>
        </div>

        <div className="mt-4">
          <label className="text-sm text-neutral-700">체크아웃 (checkOutTime)</label>
          <input
            type="time"
            value={form.checkOutTime}
            onChange={(e) => setField("checkOutTime", e.target.value)}
            disabled={isLocked}
            className="mt-2 w-full rounded-2xl border border-neutral-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900/10 disabled:bg-neutral-50"
          />
          <p className="mt-2 text-xs text-neutral-500">
            참고: 현재 Prisma 스키마에는 체크아웃 필드가 없다고 되어 있지만, create API 스키마에는 포함되어 있어 입력값은 전송됩니다.
          </p>
        </div>
      </section>

      <section className="mt-6 rounded-3xl border border-neutral-200 bg-white p-8 shadow-sm">
        <h2 className="text-lg font-semibold">호스트 소개</h2>

        <div className="mt-4 flex flex-wrap gap-2">
          {(["en", "ko", "ja", "zh"] as Lang[]).map((lang) => (
            <button
              key={lang}
              type="button"
              onClick={() => setActiveBioLang(lang)}
              className={`rounded-2xl border px-4 py-2 text-sm ${
                activeBioLang === lang
                  ? "border-neutral-900 bg-neutral-900 text-white"
                  : "border-neutral-200 bg-white text-neutral-900"
              }`}
            >
              {lang.toUpperCase()}
            </button>
          ))}
        </div>

        <textarea
          value={bioValueForLang(activeBioLang)}
          onChange={(e) => setBioForLang(activeBioLang, e.target.value)}
          disabled={isLocked}
          placeholder="예: Welcome to my stay…"
          className="mt-4 min-h-[140px] w-full rounded-2xl border border-neutral-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900/10 disabled:bg-neutral-50"
        />
      </section>

      <section className="mt-6">
        <HostListingImagesUrlEditor
          listingId={listingId}
          images={images}
          setImages={setImages}
          disabled={isLocked}
          onNeedListing={() => notify("이미지를 추가하려면 먼저 '초안 저장'을 눌러 listingId를 생성해야 합니다.")}
        />
      </section>

      <div className="mt-8 text-xs text-neutral-500">
        팁: 초안 저장 후에는 입력을 멈추면 자동 저장됩니다(약 0.8초).
      </div>
    </div>
  );
}
