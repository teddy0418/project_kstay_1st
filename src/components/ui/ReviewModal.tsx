"use client";

import { useState } from "react";
import { Star, X } from "lucide-react";
import { useI18n } from "@/components/ui/LanguageProvider";

const CATEGORY_KEYS = ["cleanliness", "accuracy", "checkIn", "communication", "location", "value"] as const;
type CategoryKey = (typeof CATEGORY_KEYS)[number];

const CAT_LABEL_KEYS: Record<CategoryKey, string> = {
  cleanliness: "review_cat_cleanliness",
  accuracy: "review_cat_accuracy",
  checkIn: "review_cat_check_in",
  communication: "review_cat_communication",
  location: "review_cat_location",
  value: "review_cat_value",
};

export type ReviewFormData = {
  cleanliness: number;
  accuracy: number;
  checkIn: number;
  communication: number;
  location: number;
  value: number;
  body: string;
};

type Props = {
  listingTitle: string;
  bookingId: string;
  onClose: () => void;
  onSubmit: (data: ReviewFormData) => Promise<void>;
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
      <span className="text-sm font-medium text-neutral-700 min-w-0 truncate">{label}</span>
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

export default function ReviewModal({ listingTitle, onClose, onSubmit }: Props) {
  const { t } = useI18n();
  const [ratings, setRatings] = useState<Record<CategoryKey, number>>(() =>
    Object.fromEntries(CATEGORY_KEYS.map((k) => [k, 0])) as Record<CategoryKey, number>
  );
  const [body, setBody] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const setCategory = (key: CategoryKey, value: number) => {
    setRatings((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const missing = CATEGORY_KEYS.filter((k) => ratings[k] < 1 || ratings[k] > 5);
    if (missing.length > 0) {
      setError(t("review_select_rating") ?? "Please rate all categories (1–5).");
      return;
    }
    const text = body.trim();
    if (!text) {
      setError("리뷰 내용을 입력해 주세요.");
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      await onSubmit({
        cleanliness: ratings.cleanliness,
        accuracy: ratings.accuracy,
        checkIn: ratings.checkIn,
        communication: ratings.communication,
        location: ratings.location,
        value: ratings.value,
        body: text,
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "저장에 실패했습니다.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <button
        type="button"
        onClick={onClose}
        className="absolute inset-0 bg-black/50"
        aria-label="Close"
      />
      <div className="relative w-full max-w-md max-h-[90vh] overflow-y-auto rounded-2xl border border-neutral-200 bg-white p-6 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">{t("write_review")}</h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 hover:bg-neutral-100 transition"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <p className="text-sm text-neutral-600 mb-4 truncate" title={listingTitle}>
          {listingTitle}
        </p>

        <form onSubmit={handleSubmit}>
          <div className="mb-4 rounded-xl border border-neutral-200 p-4">
            <p className="text-xs font-semibold text-neutral-500 mb-3">
              {t("review_select_rating")}
            </p>
            {CATEGORY_KEYS.map((key) => (
              <StarRow
                key={key}
                label={t(CAT_LABEL_KEYS[key] as "review_cat_cleanliness")}
                value={ratings[key]}
                onSelect={(v) => setCategory(key, v)}
                disabled={submitting}
              />
            ))}
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-neutral-700 mb-2">리뷰</label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder={t("review_body_placeholder") ?? "숙소에 대한 경험을 남겨 주세요."}
              rows={4}
              maxLength={2000}
              className="w-full rounded-xl border border-neutral-200 px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-neutral-400"
              disabled={submitting}
            />
            <p className="mt-1 text-xs text-neutral-500">{body.length} / 2000</p>
          </div>

          {error && (
            <p className="mb-4 text-sm text-red-600">{error}</p>
          )}

          <div className="flex gap-2 justify-end">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-neutral-200 px-4 py-2 text-sm font-medium hover:bg-neutral-50"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-xl bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800 disabled:opacity-50"
            >
              {submitting ? "저장 중…" : "저장"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
