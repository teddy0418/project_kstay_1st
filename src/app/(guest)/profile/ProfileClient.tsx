"use client";

import { useEffect, useMemo, useState } from "react";
import Container from "@/components/layout/Container";
import { useAuthModal } from "@/components/ui/AuthModalProvider";
import { useAuth } from "@/components/ui/AuthProvider";
import { useI18n } from "@/components/ui/LanguageProvider";
import { useToast } from "@/components/ui/ToastProvider";
import { apiClient } from "@/lib/api/client";
import ListingCard from "@/features/listings/components/ListingCard";
import type { Listing } from "@/types";
import ReviewModal from "@/components/ui/ReviewModal";
import Link from "next/link";

type TripItem = {
  booking: { id: string; checkIn: string; checkOut: string; nights: number; reviewed?: boolean };
  listing: Listing;
};

const PROFILE_KEY = "kst_profile";
const RECENT_KEY = "kst_recently_viewed";

type LocalProfile = {
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

type ProfileClientProps = { initialTrips: TripItem[] };

export default function ProfileClient({ initialTrips }: ProfileClientProps) {
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

  const [displayName, setDisplayName] = useState(() => (typeof window !== "undefined" ? readProfile().displayName ?? "" : ""));
  const [bio, setBio] = useState(() => (typeof window !== "undefined" ? readProfile().bio ?? "" : ""));

  // 로그인 시 서버 프로필(이름·프로필 사진) 불러오기
  const [profilePhotoUrl, setProfilePhotoUrl] = useState<string | null>(null);
  useEffect(() => {
    if (!loggedIn) return;
    apiClient
      .get<{ displayName?: string; profilePhotoUrl?: string }>("/api/user/profile")
      .then((data) => {
        if (data?.displayName != null) setDisplayName(String(data.displayName || ""));
        if (data?.profilePhotoUrl != null && data.profilePhotoUrl) setProfilePhotoUrl(String(data.profilePhotoUrl));
        else setProfilePhotoUrl(null);
      })
      .catch(() => {});
  }, [loggedIn]);

  const recentIds = useMemo(() => readRecent(), []);
  const [recentListings, setRecentListings] = useState<Listing[]>([]);
  const [recentListingsLoading, setRecentListingsLoading] = useState(false);

  const [trips, setTrips] = useState<TripItem[]>(initialTrips);
  const [tripsLoading, setTripsLoading] = useState(initialTrips.length === 0);
  const [reviewModal, setReviewModal] = useState<{ bookingId: string; listingTitle: string } | null>(null);
  const [myReviews, setMyReviews] = useState<Array<{ id: string; rating: number; body: string; createdAt: string; listing: { id: string; title?: string; titleKo?: string } | null }>>([]);
  const [myReviewsLoading, setMyReviewsLoading] = useState(true);

  const fetchTrips = () => {
    if (!loggedIn) return;
    apiClient
      .get<{ trips: TripItem[] }>("/api/bookings")
      .then((data) => {
        const list = data?.trips ?? [];
        setTrips(Array.isArray(list) ? list : []);
      })
      .catch(() => {});
  };
  const fetchMyReviews = () => {
    if (!loggedIn) return;
    apiClient
      .get<{ reviews: Array<{ id: string; rating: number; body: string; createdAt: string; listing: { id: string; title?: string; titleKo?: string } | null }> }>("/api/reviews")
      .then((data) => {
        setMyReviews(Array.isArray(data?.reviews) ? data.reviews : []);
      })
      .catch(() => setMyReviews([]));
  };

  useEffect(() => {
    if (!loggedIn) {
      setTrips([]);
      setMyReviews([]);
      setTripsLoading(false);
      setMyReviewsLoading(false);
      return;
    }
    if (initialTrips.length > 0) {
      setTrips(initialTrips);
      setTripsLoading(false);
    } else {
      setTripsLoading(true);
    }
    setMyReviewsLoading(true);
    const timeout = setTimeout(() => {
      if (initialTrips.length === 0) {
        apiClient
          .get<{ trips: TripItem[] }>("/api/bookings")
          .then((data) => setTrips(Array.isArray(data?.trips) ? data.trips : []))
          .catch(() => setTrips([]))
          .finally(() => setTripsLoading(false));
      }
      apiClient
        .get<{ reviews: Array<{ id: string; rating: number; body: string; createdAt: string; listing: { id: string; title?: string; titleKo?: string } | null }> }>("/api/reviews")
        .then((data) => setMyReviews(Array.isArray(data?.reviews) ? data.reviews : []))
        .catch(() => setMyReviews([]))
        .finally(() => setMyReviewsLoading(false));
    }, 100);
    return () => clearTimeout(timeout);
  }, [loggedIn, initialTrips.length]);

  const handleSubmitReview = async (bookingId: string, rating: number, body: string) => {
    try {
      await apiClient.post("/api/reviews", { bookingId, rating, body });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to save review";
      throw new Error(msg);
    }
    toast("리뷰가 저장되었습니다.");
    setTrips((prev) =>
      prev.map((tr) =>
        tr.booking.id === bookingId ? { ...tr, booking: { ...tr.booking, reviewed: true } } : tr
      )
    );
    fetchTrips();
    fetchMyReviews();
  };

  useEffect(() => {
    if (!loggedIn || recentIds.length === 0) {
      setRecentListings([]);
      setRecentListingsLoading(false);
      return;
    }
    setRecentListingsLoading(true);
    const ids = recentIds.slice(0, 9).join(",");
    apiClient
      .get<Listing[]>(`/api/listings?ids=${encodeURIComponent(ids)}`)
      .then((list) => setRecentListings(Array.isArray(list) ? list : []))
      .catch(() => setRecentListings([]))
      .finally(() => setRecentListingsLoading(false));
  }, [loggedIn, recentIds.join(",")]);

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

  const onSave = async () => {
    const name = displayName.trim() || "";
    writeProfile({
      displayName: name || undefined,
      bio: bio.trim() || undefined,
    });
    try {
      await apiClient.patch("/api/user/profile", { displayName: name || null });
    } catch (e) {
      toast(e instanceof Error ? e.message : "저장 실패");
      return;
    }
    toast(c.saved);
  };

  return (
    <Container className="py-10">
      <h1 className="text-2xl font-semibold tracking-tight">{t("profile_settings")}</h1>

      <div className="mt-6 grid gap-6 lg:grid-cols-[380px,1fr]">
        <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="relative block h-16 w-16 shrink-0 rounded-full border border-neutral-200 bg-neutral-100 overflow-hidden grid place-items-center">
              {profilePhotoUrl ? (
                <img src={profilePhotoUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                <span className="text-lg font-semibold text-neutral-700">{initial}</span>
              )}
            </div>

            <div className="min-w-0">
              <div className="text-sm text-neutral-500">{role?.toUpperCase()}</div>
              <div className="text-lg font-semibold truncate">{displayName || c.guest}</div>
            </div>
          </div>

          <div className="mt-6 grid gap-4">
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
            {tripsLoading ? (
              <p className="mt-2 text-sm text-neutral-500">불러오는 중…</p>
            ) : trips.length === 0 ? (
              <p className="mt-2 text-sm text-neutral-600">{t("empty_trips")}</p>
            ) : (
              <div className="mt-5 grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3">
                {trips.map((trip) => (
                  <div key={`${trip.booking.id}-${trip.listing.id}`}>
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <p className="text-xs text-neutral-500">
                        {trip.booking.checkIn} → {trip.booking.checkOut} · {trip.booking.nights}{" "}
                        {trip.booking.nights === 1 ? t("night") : t("nights")}
                      </p>
                      {trip.booking.reviewed ? (
                        <span className="text-xs text-neutral-500">{t("review_done")}</span>
                      ) : (
                        <button
                          type="button"
                          onClick={() =>
                            setReviewModal({
                              bookingId: trip.booking.id,
                              listingTitle: trip.listing.title || trip.listing.id,
                            })
                          }
                          className="text-xs font-medium text-neutral-700 underline hover:text-neutral-900"
                        >
                          {t("write_review")}
                        </button>
                      )}
                    </div>
                    <ListingCard listing={trip.listing} />
                  </div>
                ))}
              </div>
            )}
            {reviewModal && (
              <ReviewModal
                listingTitle={reviewModal.listingTitle}
                bookingId={reviewModal.bookingId}
                onClose={() => setReviewModal(null)}
                onSubmit={async (rating, body) => {
                  await handleSubmitReview(reviewModal.bookingId, rating, body);
                }}
              />
            )}
          </section>

          <section className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold">{t("your_reviews")}</h2>
            {myReviewsLoading ? (
              <p className="mt-2 text-sm text-neutral-500">불러오는 중…</p>
            ) : myReviews.length === 0 ? (
              <p className="mt-2 text-sm text-neutral-600">{c.reviewSoon}</p>
            ) : (
              <ul className="mt-5 space-y-4">
                {myReviews.map((r) => (
                  <li key={r.id} className="rounded-xl border border-neutral-200 p-4">
                    <div className="flex items-center justify-between gap-2">
                      <Link
                        href={`/listings/${r.listing?.id}`}
                        className="text-sm font-medium text-neutral-900 hover:underline"
                      >
                        {r.listing?.titleKo || r.listing?.title || r.listing?.id}
                      </Link>
                      <span className="text-sm text-amber-600">
                        {"★".repeat(r.rating)}{"☆".repeat(5 - r.rating)}
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-neutral-700 whitespace-pre-wrap">{r.body}</p>
                    <p className="mt-2 text-xs text-neutral-500">
                      {new Date(r.createdAt).toLocaleDateString()}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold">{t("recently_viewed")}</h2>
            {recentListingsLoading ? (
              <p className="mt-2 text-sm text-neutral-500">불러오는 중…</p>
            ) : recentListings.length === 0 ? (
              <p className="mt-2 text-sm text-neutral-600">{t("empty_recently_viewed")}</p>
            ) : (
              <div className="mt-5 grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3">
                {recentListings.map((l) => (
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
