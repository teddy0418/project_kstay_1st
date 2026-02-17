"use client";

import { useMemo, useState } from "react";
import Container from "@/components/layout/Container";
import { useAuthModal } from "@/components/ui/auth/AuthModalProvider";
import { useAuth } from "@/components/ui/AuthProvider";
import { useI18n } from "@/components/ui/LanguageProvider";
import { useToast } from "@/components/ui/ToastProvider";
import { listings } from "@/lib/mockData";
import ListingCard from "@/features/listings/components/ListingCard";
import type { Listing } from "@/types";

const PROFILE_KEY = "kst_profile";
const RECENT_KEY = "kst_recently_viewed";

type LocalProfile = {
  photoUrl?: string;
  displayName?: string;
  bio?: string;
};

function readProfile(): LocalProfile {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(PROFILE_KEY);
    const obj = raw ? JSON.parse(raw) : {};
    return obj && typeof obj === "object" ? obj : {};
  } catch {
    return {};
  }
}

function writeProfile(p: LocalProfile) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(PROFILE_KEY, JSON.stringify(p));
  } catch {}
}

function readRecent(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(RECENT_KEY);
    const arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? arr.map(String) : [];
  } catch {
    return [];
  }
}

export default function ProfilePage() {
  const { open: openAuthModal } = useAuthModal();
  const { user, isAuthed } = useAuth();
  const { t } = useI18n();
  const { toast } = useToast();

  const loggedIn = isAuthed;
  const role = user?.role;

  const [photoUrl, setPhotoUrl] = useState(() => (typeof window !== "undefined" ? readProfile().photoUrl ?? "" : ""));
  const [displayName, setDisplayName] = useState(() => (typeof window !== "undefined" ? readProfile().displayName ?? "" : ""));
  const [bio, setBio] = useState(() => (typeof window !== "undefined" ? readProfile().bio ?? "" : ""));

  const recentIds = useMemo(() => readRecent(), []);
  const recentListings = useMemo(() => {
    const map = new Map(listings.map((l) => [String(l.id), l]));
    return recentIds.map((id) => map.get(id)).filter(Boolean) as Listing[];
  }, [recentIds]);

  if (!loggedIn) {
    return (
      <Container className="py-10">
        <h1 className="text-2xl font-semibold tracking-tight">{t("profile_settings")}</h1>
        <p className="mt-2 text-sm text-neutral-600">{t("sign_in_to_manage")}</p>

        <button
          type="button"
          onClick={() => openAuthModal({ next: "/profile", role: "GUEST" })}
          className="mt-5 rounded-xl bg-neutral-900 px-5 py-3 text-sm font-semibold text-white hover:opacity-95 transition"
        >
          {t("login_signup")}
        </button>
      </Container>
    );
  }

  const initial = displayName?.trim()?.[0]?.toUpperCase() || "U";

  const onSave = () => {
    writeProfile({
      photoUrl: photoUrl.trim() || undefined,
      displayName: displayName.trim() || undefined,
      bio: bio.trim() || undefined,
    });
    toast("Saved.");
  };

  return (
    <Container className="py-10">
      <h1 className="text-2xl font-semibold tracking-tight">{t("profile_settings")}</h1>

      <div className="mt-6 grid gap-6 lg:grid-cols-[380px,1fr]">
        <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 overflow-hidden rounded-full border border-neutral-200 bg-neutral-100 grid place-items-center">
              {photoUrl ? (
                <img src={photoUrl} alt="Profile" className="h-full w-full object-cover" />
              ) : (
                <div className="text-lg font-semibold text-neutral-700">{initial}</div>
              )}
            </div>

            <div className="min-w-0">
              <div className="text-sm text-neutral-500">{role?.toUpperCase()}</div>
              <div className="text-lg font-semibold truncate">{displayName || "Guest"}</div>
            </div>
          </div>

          <div className="mt-6 grid gap-4">
            <div className="rounded-xl border border-neutral-200 px-3 py-2">
              <label className="text-xs font-semibold text-neutral-500">{t("photo_url")}</label>
              <input
                value={photoUrl}
                onChange={(e) => setPhotoUrl(e.target.value)}
                placeholder="https://..."
                className="mt-1 w-full text-sm outline-none"
              />
            </div>

            <div className="rounded-xl border border-neutral-200 px-3 py-2">
              <label className="text-xs font-semibold text-neutral-500">{t("display_name")}</label>
              <input
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Your name"
                className="mt-1 w-full text-sm outline-none"
              />
            </div>

            <div className="rounded-xl border border-neutral-200 px-3 py-2">
              <label className="text-xs font-semibold text-neutral-500">{t("about_you")}</label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Tell guests a little about you"
                className="mt-1 w-full resize-none text-sm outline-none"
                rows={5}
              />
            </div>

            <button
              type="button"
              onClick={onSave}
              className="rounded-xl bg-neutral-900 px-4 py-3 text-sm font-semibold text-white hover:opacity-95 transition"
            >
              {t("save_changes")}
            </button>

            <div className="text-xs text-neutral-500 leading-5">
              MVP 안내: 지금은 이 정보가 브라우저(LocalStorage)에 저장됩니다. <br />
              DB/구글 로그인 연결 단계에서 사용자 계정별로 서버 저장으로 전환합니다.
            </div>
          </div>
        </div>

        <div className="grid gap-6">
          <section className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold">{t("your_trips")}</h2>
            <p className="mt-2 text-sm text-neutral-600">{t("empty_trips")}</p>
          </section>

          <section className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold">{t("your_reviews")}</h2>
            <p className="mt-2 text-sm text-neutral-600">
              Reviews will appear here after we enable review writing.
            </p>
          </section>

          <section className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold">{t("recently_viewed")}</h2>

            {recentListings.length === 0 ? (
              <p className="mt-2 text-sm text-neutral-600">{t("empty_recently_viewed")}</p>
            ) : (
              <div className="mt-5 grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3">
                {recentListings.slice(0, 9).map((l) => (
                  <ListingCard key={l.id} listing={l} />
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </Container>
  );
}
