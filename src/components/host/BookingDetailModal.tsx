"use client";

import { useEffect, useState } from "react";
import { X, FileText } from "lucide-react";

export type BookingDetailData = {
  id: string;
  listingId: string;
  listingTitle: string;
  guestName: string | null;
  checkIn: string;
  checkOut: string;
  nights: number;
  status: string;
  totalKrw: number;
  guestPayment: { accommodationKrw: number; guestServiceFee: number; totalKrw: number };
  hostPayout: { accommodationKrw: number; totalKrw: number };
};

type Props = {
  open: boolean;
  onClose: () => void;
  bookingId: string | null;
  listingId: string;
};

function formatKrw(n: number) {
  return `₩${n.toLocaleString()}`;
}

export default function BookingDetailModal({ open, onClose, bookingId }: Props) {
  const [detail, setDetail] = useState<BookingDetailData | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !bookingId) return;
    queueMicrotask(() => {
      setDetail(null);
      setErrorMessage(null);
      setLoading(true);
    });
    fetch(`/api/host/bookings/${bookingId}/detail`)
      .then(async (r) => {
        const text = await r.text();
        let body: { data?: BookingDetailData; error?: { code?: string; message?: string } } = {};
        if (text) {
          try {
            body = JSON.parse(text);
          } catch {
            body = {};
          }
        }
        if (r.ok && body.data) {
          const d = body.data;
          const checkInStr = typeof d.checkIn === "string" ? d.checkIn.slice(0, 10) : "";
          const checkOutStr = typeof d.checkOut === "string" ? d.checkOut.slice(0, 10) : "";
          setDetail({ ...d, checkIn: checkInStr, checkOut: checkOutStr });
        } else {
          const msg =
            body.error?.message ||
            (r.status === 401 ? "로그인이 필요합니다." :
             r.status === 404 ? "예약을 찾을 수 없습니다." :
             r.status >= 500 ? "일시적인 오류가 발생했습니다. 잠시 후 다시 시도해 주세요." :
             "예약 정보를 불러올 수 없습니다.");
          setErrorMessage(msg);
        }
      })
      .catch(() => setErrorMessage("네트워크 오류가 발생했습니다."))
      .finally(() => setLoading(false));
  }, [open, bookingId]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} aria-hidden />
      <div className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-neutral-200 bg-white shadow-xl">
        <div className="sticky top-0 flex items-center justify-end border-b border-neutral-100 bg-white p-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900"
            aria-label="닫기"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6">
          {loading && !detail ? (
            <div className="py-8 text-center text-neutral-500">불러오는 중...</div>
          ) : !detail ? (
            <div className="py-8 text-center text-neutral-500">
              {errorMessage ?? "예약 정보를 불러올 수 없습니다."}
            </div>
          ) : (
            <>
              {detail && (
                <>
                  <h2 className="text-lg font-bold text-neutral-900">결제·정산 상세</h2>
                  <p className="mt-1 text-sm text-neutral-500">{detail.listingTitle} · {detail.nights}박</p>

                  <section className="mt-6">
                    <h3 className="text-sm font-bold text-neutral-900">게스트가 결제한 금액</h3>
                    <ul className="mt-2 space-y-1 text-sm text-neutral-700">
                      <li className="flex justify-between">
                        <span>숙박료</span>
                        <span>{formatKrw(detail.guestPayment.accommodationKrw)}</span>
                      </li>
                      <li className="flex justify-between">
                        <span>게스트 서비스 수수료(12%)</span>
                        <span>{formatKrw(detail.guestPayment.guestServiceFee)}</span>
                      </li>
                      <li className="mt-2 flex justify-between border-t border-neutral-100 pt-2 font-semibold">
                        <span>총 금액(KRW)</span>
                        <span>{formatKrw(detail.guestPayment.totalKrw)}</span>
                      </li>
                    </ul>
                  </section>

                  <section className="mt-6 border-t border-neutral-200 pt-6">
                    <h3 className="text-sm font-bold text-neutral-900">호스트 수령 대금</h3>
                    <ul className="mt-2 space-y-1 text-sm text-neutral-700">
                      <li className="flex justify-between">
                        <span>{detail.nights}박 숙박료</span>
                        <span>{formatKrw(detail.hostPayout.accommodationKrw)}</span>
                      </li>
                      <li className="mt-2 flex justify-between border-t border-neutral-100 pt-2 font-semibold">
                        <span>총 수령액(KRW)</span>
                        <span>{formatKrw(detail.hostPayout.totalKrw)}</span>
                      </li>
                    </ul>
                  </section>

                  <a
                    href="/host/settlements"
                    className="mt-4 flex items-center gap-2 rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm font-semibold text-neutral-700 hover:bg-neutral-100"
                  >
                    <FileText className="h-4 w-4" />
                    대금 수령 내역
                  </a>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
