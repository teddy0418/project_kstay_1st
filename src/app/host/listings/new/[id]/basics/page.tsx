"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useListingWizard } from "@/features/host/listings/ListingWizardContext";
import { useToast } from "@/components/ui/ToastProvider";
import { apiClient } from "@/lib/api/client";
import { processHostProfileImage } from "@/lib/utils";

type Lang = "en" | "ko" | "ja" | "zh";

function pickTitle(l: { title?: string | null; titleKo?: string | null; titleJa?: string | null; titleZh?: string | null }) {
  return (l.title?.trim() || l.titleKo?.trim() || l.titleJa?.trim() || l.titleZh?.trim() || "") as string;
}

export default function WizardBasicsPage() {
  const { listing, patch, isLocked, dirty, setDirty, performSaveRef, setSaving } = useListingWizard();
  const { toast } = useToast();
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [titleKo, setTitleKo] = useState("");
  const [titleJa, setTitleJa] = useState("");
  const [titleZh, setTitleZh] = useState("");
  const [checkInTime, setCheckInTime] = useState("15:00");
  const [checkOutTime, setCheckOutTime] = useState("11:00");
  const [hostBioSingle, setHostBioSingle] = useState("");
  const [activeTitle, setActiveTitle] = useState<Lang>("ko");
  const [hostPhotoUrl, setHostPhotoUrl] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    apiClient
      .get<{ profilePhotoUrl?: string }>("/api/user/profile")
      .then((data) => {
        const url = data?.profilePhotoUrl;
        if (url && typeof url === "string") setHostPhotoUrl(url);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!listing) return;
    setTitle(listing.title ?? "");
    setTitleKo(listing.titleKo ?? "");
    setTitleJa(listing.titleJa ?? "");
    setTitleZh(listing.titleZh ?? "");
    setCheckInTime(listing.checkInTime ?? "15:00");
    setCheckOutTime(listing.checkOutTime ?? "11:00");
    setHostBioSingle(listing.hostBioKo?.trim() || listing.hostBio?.trim() || "");
  }, [listing]);

  const save = useCallback(async () => {
    if (!listing || isLocked) return;
    setSaving(true);
    try {
      const t = pickTitle({ title, titleKo, titleJa, titleZh }) || titleKo || titleJa || titleZh || "제목 없음";
      await patch({
        title: t,
        titleKo: titleKo.trim() || undefined,
        titleJa: titleJa.trim() || undefined,
        titleZh: titleZh.trim() || undefined,
        checkInTime: checkInTime || undefined,
        checkOutTime: checkOutTime || undefined,
        hostBio: hostBioSingle.trim() || undefined,
        hostBioKo: hostBioSingle.trim() || undefined,
      });
      if (hostPhotoUrl.trim()) {
        await apiClient.patch("/api/user/profile", { profilePhotoUrl: hostPhotoUrl.trim() });
      }
      setDirty(false);
      toast("저장됨");
    } finally {
      setSaving(false);
    }
  }, [listing, isLocked, patch, title, titleKo, titleJa, titleZh, checkInTime, checkOutTime, hostBioSingle, hostPhotoUrl, setDirty, setSaving, toast]);

  useEffect(() => {
    performSaveRef.current = save;
    return () => {
      performSaveRef.current = null;
    };
  }, [performSaveRef, save]);

  const handleChange = useCallback(() => {
    setDirty(true);
  }, [setDirty]);

  const goNext = useCallback(async () => {
    if (listing && dirty) {
      setSaving(true);
      try {
        const t = pickTitle({ title, titleKo, titleJa, titleZh }) || titleKo || titleJa || titleZh || "제목 없음";
        await patch({
          title: t,
          titleKo: titleKo.trim() || undefined,
          titleJa: titleJa.trim() || undefined,
          titleZh: titleZh.trim() || undefined,
          checkInTime: checkInTime || undefined,
          checkOutTime: checkOutTime || undefined,
          hostBio: hostBioSingle.trim() || undefined,
          hostBioKo: hostBioSingle.trim() || undefined,
        });
        if (hostPhotoUrl.trim()) {
          await apiClient.patch("/api/user/profile", { profilePhotoUrl: hostPhotoUrl.trim() });
        }
        setDirty(false);
        router.push(`/host/listings/new/${listing.id}/location`);
      } catch (e) {
        toast(e instanceof Error ? e.message : "저장에 실패했습니다.");
      } finally {
        setSaving(false);
      }
    } else if (listing) {
      router.push(`/host/listings/new/${listing.id}/location`);
    }
  }, [listing, dirty, title, titleKo, titleJa, titleZh, checkInTime, checkOutTime, hostBioSingle, hostPhotoUrl, patch, setDirty, setSaving, router, toast]);

  if (!listing) return null;

  const titleVal = activeTitle === "en" ? title : activeTitle === "ko" ? titleKo : activeTitle === "ja" ? titleJa : titleZh;
  const setTitleVal = (v: string) => {
    handleChange();
    if (activeTitle === "en") setTitle(v);
    else if (activeTitle === "ko") setTitleKo(v);
    else if (activeTitle === "ja") setTitleJa(v);
    else setTitleZh(v);
  };

  return (
    <div className="rounded-3xl border border-neutral-200 bg-white p-8 shadow-sm">
      <h2 className="text-xl font-semibold">기본 정보</h2>
      <p className="mt-1 text-sm text-neutral-600">숙소 이름, 체크인/아웃, 호스트 소개를 입력하세요.</p>

      <section className="mt-6">
        <h3 className="text-sm font-medium text-neutral-700">숙소 이름</h3>
        <div className="mt-2 flex flex-wrap gap-2">
          {(["en", "ko", "ja", "zh"] as Lang[]).map((lang) => (
            <button
              key={lang}
              type="button"
              onClick={() => setActiveTitle(lang)}
              className={`rounded-2xl border px-3 py-1.5 text-sm ${activeTitle === lang ? "border-neutral-900 bg-neutral-900 text-white" : "border-neutral-200"}`}
            >
              {lang.toUpperCase()}
            </button>
          ))}
        </div>
        <input
          value={titleVal}
          onChange={(e) => setTitleVal(e.target.value)}
          disabled={isLocked}
          placeholder="숙소 이름을 입력하세요"
          className="mt-3 w-full rounded-2xl border border-neutral-200 px-4 py-3 text-sm disabled:bg-neutral-50"
        />
      </section>

      <section className="mt-6 grid gap-4 sm:grid-cols-2">
        <div>
          <label className="text-sm font-medium text-neutral-700">체크인</label>
          <input
            type="time"
            value={checkInTime}
            onChange={(e) => { handleChange(); setCheckInTime(e.target.value); }}
            disabled={isLocked}
            className="mt-2 w-full rounded-2xl border border-neutral-200 px-4 py-3 text-sm disabled:bg-neutral-50"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-neutral-700">체크아웃</label>
          <input
            type="time"
            value={checkOutTime}
            onChange={(e) => { handleChange(); setCheckOutTime(e.target.value); }}
            disabled={isLocked}
            className="mt-2 w-full rounded-2xl border border-neutral-200 px-4 py-3 text-sm disabled:bg-neutral-50"
          />
        </div>
      </section>

      <section className="mt-6">
        <h3 className="text-sm font-medium text-neutral-700">호스트 소개</h3>
        <p className="mt-1 text-xs text-neutral-500">입력한 내용은 기본(hostBio)과 한국어(hostBioKo)에 저장됩니다.</p>
        <textarea
          value={hostBioSingle}
          onChange={(e) => { handleChange(); setHostBioSingle(e.target.value); }}
          disabled={isLocked}
          rows={4}
          placeholder="호스트 소개를 입력하세요"
          className="mt-3 w-full rounded-2xl border border-neutral-200 px-4 py-3 text-sm disabled:bg-neutral-50"
        />
      </section>

      <section className="mt-6">
        <h3 className="text-sm font-medium text-neutral-700">호스트 프로필 사진</h3>
        <p className="mt-1 text-xs text-neutral-500">숙소 상세 페이지에 노출됩니다. JPEG/PNG/WebP, 최대 5MB, 200×200px 이상.</p>
        <div className="mt-3 flex items-center gap-4">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isLocked}
            className="relative h-20 w-20 shrink-0 overflow-hidden rounded-full border border-neutral-200 bg-neutral-100 focus:outline-none focus:ring-2 focus:ring-neutral-400 focus:ring-offset-2 disabled:opacity-50"
          >
            {hostPhotoUrl ? (
              <Image src={hostPhotoUrl} alt="호스트" fill className="object-cover" sizes="80px" unoptimized />
            ) : (
              <span className="absolute inset-0 grid place-items-center text-2xl font-semibold text-neutral-500">?</span>
            )}
          </button>
          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="sr-only"
              onChange={(e) => {
                const file = e.target.files?.[0];
                e.target.value = "";
                if (!file) return;
                handleChange();
                processHostProfileImage(file).then(setHostPhotoUrl).catch((msg) => toast(msg));
              }}
            />
            <p className="text-sm text-neutral-600">
              {hostPhotoUrl ? "사진이 선택되었습니다. 저장 버튼을 누르면 반영됩니다." : "사진을 선택하면 미리보기가 표시됩니다."}
            </p>
          </div>
        </div>
      </section>

      <div className="mt-8 flex justify-end">
        <button
          type="button"
          onClick={() => void goNext()}
          disabled={isLocked}
          className="rounded-2xl bg-neutral-900 px-6 py-3 text-sm font-medium text-white hover:bg-neutral-800 disabled:opacity-50"
        >
          다음: 위치
        </button>
      </div>
    </div>
  );
}
