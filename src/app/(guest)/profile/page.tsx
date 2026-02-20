"use client";

import { useMemo, useState } from "react";
import Container from "@/components/layout/Container";
import Image from "next/image";
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
  const { t, lang } = useI18n();
  const { toast } = useToast();

  const loggedIn = isAuthed;
  const role = user?.role;
  const c =
    lang === "ko"
      ? {
          saved: "저장되었습니다.",
          guest: "게스트",
          yourName: "이름을 입력하세요",
          about: "게스트에게 나를 소개해 보세요",
          reviewSoon: "리뷰 작성 기능이 열리면 여기에 표시됩니다.",
          mvpNote:
            "MVP 안내: 지금은 이 정보가 브라우저(LocalStorage)에 저장됩니다. DB/구글 로그인 연결 단계에서 사용자 계정별 서버 저장으로 전환됩니다.",
        }
      : lang === "ja"
        ? {
            saved: "保存しました。",
            guest: "ゲスト",
            yourName: "お名前を入力してください",
            about: "ゲストに自己紹介を書いてみましょう",
            reviewSoon: "レビュー機能が有効になると、ここに表示されます。",
            mvpNote:
              "MVP: 現在この情報はブラウザ(LocalStorage)に保存されます。後続のDB/Googleログイン連携でアカウント別のサーバー保存へ移行します。",
          }
        : lang === "zh"
          ? {
              saved: "已保存。",
              guest: "客人",
              yourName: "请输入姓名",
              about: "向客人简单介绍一下自己",
              reviewSoon: "开启评价功能后会显示在这里。",
              mvpNote:
                "MVP 提示：当前这些信息仅保存在浏览器(LocalStorage)中。后续接入 DB/Google 登录后会改为账号级服务端存储。",
            }
          : {
              saved: "Saved.",
              guest: "Guest",
              yourName: "Your name",
              about: "Tell guests a little about you",
              reviewSoon: "Reviews will appear here after we enable review writing.",
              mvpNote:
                "MVP note: this data is stored in browser LocalStorage for now. It will move to account-level server storage after DB/Google auth integration.",
            };

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
    toast(c.saved);
  };

  return (
    <Container className="py-10">
      <h1 className="text-2xl font-semibold tracking-tight">{t("profile_settings")}</h1>

      <div className="mt-6 grid gap-6 lg:grid-cols-[380px,1fr]">
        <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 overflow-hidden rounded-full border border-neutral-200 bg-neutral-100 grid place-items-center">
              {photoUrl ? (
                <Image
                  src={photoUrl}
                  alt="Profile"
                  width={64}
                  height={64}
                  className="h-full w-full object-cover"
                  unoptimized
                />
              ) : (
                <div className="text-lg font-semibold text-neutral-700">{initial}</div>
              )}
            </div>

            <div className="min-w-0">
              <div className="text-sm text-neutral-500">{role?.toUpperCase()}</div>
              <div className="text-lg font-semibold truncate">{displayName || c.guest}</div>
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
                placeholder={c.yourName}
                className="mt-1 w-full text-sm outline-none"
              />
            </div>

            <div className="rounded-xl border border-neutral-200 px-3 py-2">
              <label className="text-xs font-semibold text-neutral-500">{t("about_you")}</label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder={c.about}
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

            <div className="text-xs text-neutral-500 leading-5">{c.mvpNote}</div>
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
              {c.reviewSoon}
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
