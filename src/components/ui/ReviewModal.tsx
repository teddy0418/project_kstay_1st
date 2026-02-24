"use client";

import { useState } from "react";
import { Star, X } from "lucide-react";
import { useI18n } from "@/components/ui/LanguageProvider";

type Props = {
  listingTitle: string;
  bookingId: string;
  onClose: () => void;
  onSubmit: (rating: number, body: string) => Promise<void>;
};

export default function ReviewModal({ listingTitle, bookingId, onClose, onSubmit }: Props) {
  const { t } = useI18n();
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [body, setBody] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating < 1 || rating > 5) {
      setError("별점을 선택해 주세요.");
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
      await onSubmit(rating, text);
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
      <div className="relative w-full max-w-md rounded-2xl border border-neutral-200 bg-white p-6 shadow-xl">
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
          <div className="mb-4">
            <label className="block text-sm font-medium text-neutral-700 mb-2">별점 (1~5)</label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setRating(i)}
                  onMouseEnter={() => setHover(i)}
                  onMouseLeave={() => setHover(0)}
                  className="p-1 rounded focus:outline-none focus:ring-2 focus:ring-neutral-400"
                  aria-label={`${i}점`}
                >
                  <Star
                    className={`h-8 w-8 transition ${
                      i <= (hover || rating) ? "fill-amber-400 text-amber-400" : "text-neutral-300"
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-neutral-700 mb-2">리뷰</label>
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
