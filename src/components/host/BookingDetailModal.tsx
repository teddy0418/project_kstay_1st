"use client";

import { useEffect, useState } from "react";
import { X, FileText } from "lucide-react";

export type BookingDetailData = {
  id: string;
  listingId: string;
  listingTitle: string;
  guestName: string | null;
  guestNationality: string | null;
  checkIn: string;
  checkOut: string;
  nights: number;
  status: string;
  cancelledBy: string | null;
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

/** 국가 코드 → 한글 국가명 (없으면 원문 그대로) */
const COUNTRY_NAME_KO: Record<string, string> = {
  KR: "대한민국",
  US: "미국",
  JP: "일본",
  CN: "중국",
  TW: "대만",
  HK: "홍콩",
  SG: "싱가포르",
  TH: "태국",
  VN: "베트남",
  GB: "영국",
  DE: "독일",
  FR: "프랑스",
  AU: "호주",
  CA: "캐나다",
  MX: "멕시코",
  RU: "러시아",
  IN: "인도",
  ID: "인도네시아",
  MY: "말레이시아",
  PH: "필리핀",
};
function formatCountryName(value: string | null | undefined): string {
  if (value == null || value === "") return "—";
  const trimmed = value.trim().toUpperCase();
  return COUNTRY_NAME_KO[trimmed] ?? value;
}

export default function BookingDetailModal({ open, onClose, bookingId }: Props) {
  const [detail, setDetail] = useState<BookingDetailData | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !bookingId) return;
    const ac = new AbortController();
    queueMicrotask(() => {
      setDetail(null);
      setErrorMessage(null);
      setLoading(true);
    });
    fetch(`/api/host/bookings/${bookingId}/detail`, { signal: ac.signal })
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
          setDetail({ ...d, checkIn: checkInStr, checkOut: checkOutStr, cancelledBy: d.cancelledBy ?? null });
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
      .catch((err) => { if (err?.name !== "AbortError") setErrorMessage("네트워크 오류가 발생했습니다."); })
      .finally(() => setLoading(false));
    return () => ac.abort();
  }, [open, bookingId]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} aria-hidden />
      <div className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-neutral-200 bg-white shadow-xl">
        <div className="p-6">
          {loading && !detail ? (
            <div className="flex items-center justify-between py-8">
              <span className="text-neutral-500">불러오는 중...</span>
              <button type="button" onClick={onClose} className="rounded-lg p-2 text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900" aria-label="닫기"><X className="h-5 w-5" /></button>
            </div>
          ) : !detail ? (
            <div className="flex items-start justify-between gap-3">
              <p className="py-4 text-neutral-500">{errorMessage ?? "예약 정보를 불러올 수 없습니다."}</p>
              <button type="button" onClick={onClose} className="shrink-0 rounded-lg p-2 text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900" aria-label="닫기"><X className="h-5 w-5" /></button>
            </div>
          ) : (
            <>
              {detail && (
                <>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h2 className="text-lg font-bold text-neutral-900">예약 상세</h2>
                      <p className="mt-1 text-sm text-neutral-500">{detail.listingTitle} · {detail.nights}박</p>
                    </div>
                    <button
                      type="button"
                      onClick={onClose}
                      className="shrink-0 rounded-lg p-2 text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900"
                      aria-label="닫기"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>

                  <section className="mt-6 rounded-xl border border-neutral-100 bg-neutral-50/50 p-4">
                    <h3 className="text-sm font-bold text-neutral-900">예약 정보</h3>
                    <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1.5 text-sm text-neutral-700">
                      <dt className="text-neutral-500">게스트</dt>
                      <dd className="font-medium">{detail.guestName ?? "—"}</dd>
                      <dt className="text-neutral-500">국가</dt>
                      <dd>{formatCountryName(detail.guestNationality)}</dd>
                      <dt className="text-neutral-500">체크인</dt>
                      <dd>{detail.checkIn}</dd>
                      <dt className="text-neutral-500">체크아웃</dt>
                      <dd>{detail.checkOut}</dd>
                      <dt className="text-neutral-500">상태</dt>
                      <dd>
                        <span className={detail.status === "CONFIRMED" ? "text-emerald-600 font-semibold" : detail.status === "CANCELLED" ? "text-red-600 font-semibold" : "text-neutral-600"}>
                          {detail.status === "CONFIRMED"
                            ? "예약 확정"
                            : detail.status === "CANCELLED"
                              ? detail.cancelledBy === "GUEST"
                                ? "게스트 측 취소"
                                : detail.cancelledBy === "HOST"
                                  ? "호스트 측 취소"
                                  : "취소"
                              : detail.status}
                        </span>
                      </dd>
                    </dl>
                  </section>

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
