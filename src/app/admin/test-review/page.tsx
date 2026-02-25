"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Star } from "lucide-react";
import { apiClient } from "@/lib/api/client";
import type { Listing } from "@/types";

const CATEGORY_KEYS = ["cleanliness", "accuracy", "checkIn", "communication", "location", "value"] as const;
const LABELS: Record<(typeof CATEGORY_KEYS)[number], string> = {
  cleanliness: "청결도",
  accuracy: "정확성",
  checkIn: "체크인",
  communication: "소통",
  location: "위치",
  value: "가성비",
};

function StarRow({
  label,
  value,
  onSelect,
  disabled,
}: {
  label: string;
  value: number;
  onSelect: (v: number) => void;
  disabled?: boolean;
}) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex items-center justify-between gap-4 py-2">
      <span className="text-sm font-medium text-neutral-700 min-w-0">{label}</span>
      <div className="flex gap-0.5 shrink-0">
        {[1, 2, 3, 4, 5].map((i) => (
          <button
            key={i}
            type="button"
            onClick={() => onSelect(i)}
            onMouseEnter={() => setHover(i)}
            onMouseLeave={() => setHover(0)}
            disabled={disabled}
            className="p-0.5 rounded focus:outline-none focus:ring-2 focus:ring-neutral-400 disabled:opacity-50"
            aria-label={`${i}`}
          >
            <Star
              className={`h-6 w-6 transition ${
                i <= (hover || value) ? "fill-amber-400 text-amber-400" : "text-neutral-300"
              }`}
            />
          </button>
        ))}
      </div>
    </div>
  );
}

export default function AdminTestReviewPage() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loadingListings, setLoadingListings] = useState(true);
  const [listingId, setListingId] = useState("");
  const [ratings, setRatings] = useState<Record<(typeof CATEGORY_KEYS)[number], number>>(() =>
    Object.fromEntries(CATEGORY_KEYS.map((k) => [k, 0])) as Record<(typeof CATEGORY_KEYS)[number], number>
  );
  const [body, setBody] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<{ listingId: string } | null>(null);

  useEffect(() => {
    apiClient
      .get<Listing[]>("/api/admin/listings?approvedOnly=1")
      .then((list) => {
        setListings(Array.isArray(list) ? list : []);
        if (Array.isArray(list) && list.length > 0 && !listingId) setListingId(list[0].id);
      })
      .catch(() => setListings([]))
      .finally(() => setLoadingListings(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run once on mount to load listings
  }, []);

  const setCategory = (key: (typeof CATEGORY_KEYS)[number], value: number) => {
    setRatings((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!listingId.trim()) {
      setError("숙소를 선택해 주세요.");
      return;
    }
    const missing = CATEGORY_KEYS.filter((k) => ratings[k] < 1 || ratings[k] > 5);
    if (missing.length > 0) {
      setError("모든 항목에 별점(1~5)을 선택해 주세요.");
      return;
    }
    if (!body.trim()) {
      setError("리뷰 내용을 입력해 주세요.");
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      await apiClient.post("/api/admin/reviews", {
        listingId: listingId.trim(),
        body: body.trim(),
        cleanliness: ratings.cleanliness,
        accuracy: ratings.accuracy,
        checkIn: ratings.checkIn,
        communication: ratings.communication,
        location: ratings.location,
        value: ratings.value,
      });
      setCreated({ listingId });
    } catch (err) {
      setError(err instanceof Error ? err.message : "저장에 실패했습니다.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-lg">
      <h1 className="text-xl font-semibold">테스트 리뷰 남기기</h1>
      <p className="mt-1 text-sm text-neutral-600">
        관리자 계정으로 지정한 숙소에 리뷰 1개를 남깁니다. (테스트용 예약이 자동 생성됩니다.)
      </p>

      {created ? (
        <div className="mt-6 rounded-2xl border border-green-200 bg-green-50 p-5">
          <p className="font-medium text-green-800">리뷰가 저장되었습니다.</p>
          <p className="mt-1 text-sm text-green-700">해당 숙소 상세 페이지에서 확인할 수 있습니다.</p>
          <div className="mt-4 flex gap-3">
            <Link
              href={`/listings/${created.listingId}`}
              className="rounded-xl bg-green-700 px-4 py-2 text-sm font-medium text-white hover:bg-green-800"
            >
              숙소 상세에서 보기
            </Link>
            <button
              type="button"
              onClick={() => {
                setCreated(null);
                setRatings(Object.fromEntries(CATEGORY_KEYS.map((k) => [k, 0])) as Record<(typeof CATEGORY_KEYS)[number], number>);
                setBody("");
              }}
              className="rounded-xl border border-neutral-200 px-4 py-2 text-sm font-medium hover:bg-neutral-50"
            >
              하나 더 남기기
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="mt-6 space-y-5">
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">숙소 선택</label>
            {loadingListings ? (
              <p className="text-sm text-neutral-500">불러오는 중…</p>
            ) : listings.length === 0 ? (
              <p className="text-sm text-neutral-500">
                DB에 승인된 숙소가 없습니다. 관리자 → 승인에서 숙소를 먼저 승인해 주세요.
              </p>
            ) : (
              <select
                value={listingId}
                onChange={(e) => setListingId(e.target.value)}
                className="w-full rounded-xl border border-neutral-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-400"
              >
                {listings.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.title ?? l.id}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className="rounded-xl border border-neutral-200 p-4">
            <p className="text-xs font-semibold text-neutral-500 mb-3">각 항목별 별점 (1~5)</p>
            {CATEGORY_KEYS.map((key) => (
              <StarRow
                key={key}
                label={LABELS[key]}
                value={ratings[key]}
                onSelect={(v) => setCategory(key, v)}
                disabled={submitting}
              />
            ))}
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">리뷰 내용</label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="숙소에 대한 경험을 남겨 주세요."
              rows={4}
              maxLength={2000}
              className="w-full rounded-xl border border-neutral-200 px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-neutral-400"
              disabled={submitting}
            />
            <p className="mt-1 text-xs text-neutral-500">{body.length} / 2000</p>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={submitting || listings.length === 0}
              className="rounded-xl bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800 disabled:opacity-50"
            >
              {submitting ? "저장 중…" : "테스트 리뷰 저장"}
            </button>
            <Link
              href="/admin"
              className="rounded-xl border border-neutral-200 px-4 py-2 text-sm font-medium hover:bg-neutral-50"
            >
              취소
            </Link>
          </div>
        </form>
      )}
    </div>
  );
}
