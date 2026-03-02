"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { apiClient, ApiClientError } from "@/lib/api/client";

type ReviewData = {
  id: string;
  status: string;
  approvedAt: string | null;
  createdAt: string;
  title: string;
  titleKo: string | null;
  titleJa: string | null;
  titleZh: string | null;
  city: string;
  area: string;
  address: string;
  country: string | null;
  stateProvince: string | null;
  cityDistrict: string | null;
  roadAddress: string | null;
  detailedAddress: string | null;
  zipCode: string | null;
  basePriceKrw: number;
  extraGuestFeeKrw: number | null;
  hostBio: string | null;
  hostBioKo: string | null;
  hostBioJa: string | null;
  hostBioZh: string | null;
  checkInTime: string;
  checkOutTime: string | null;
  checkInGuideMessage: string | null;
  houseRulesMessage: string | null;
  amenities: string[];
  propertyType: string | null;
  maxGuests: number | null;
  bedrooms: number | null;
  beds: number | null;
  bathrooms: number | null;
  businessRegistrationDocUrl: string | null;
  lodgingReportDocUrl: string | null;
  images: { id: string; url: string; sortOrder: number }[];
  host: {
    id: string;
    name: string | null;
    email: string | null;
    phone: string | null;
    displayName: string | null;
  };
  hostProfile: {
    displayName: string | null;
    payoutBank: string | null;
    payoutAccount: string | null;
    payoutName: string | null;
  } | null;
};

const STATUS_LABEL: Record<string, string> = {
  DRAFT: "초안",
  PENDING: "승인 대기",
  APPROVED: "승인됨",
  REJECTED: "거절됨",
};

function DocBlock({ label, url }: { label: string; url: string | null }) {
  if (!url) return <p className="text-sm text-amber-600">미제출</p>;
  const isPdf = url.toLowerCase().endsWith(".pdf");
  return (
    <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4">
      <p className="mb-2 text-sm font-medium text-neutral-700">{label}</p>
      {isPdf ? (
        <a href={url} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline">
          PDF 보기
        </a>
      ) : (
        <a href={url} target="_blank" rel="noopener noreferrer" className="block">
          <img src={url} alt={label} className="max-h-64 w-auto rounded-lg object-contain" />
        </a>
      )}
    </div>
  );
}

export default function AdminListingReviewPage() {
  const params = useParams();
  const router = useRouter();
  const id = typeof params.id === "string" ? params.id : Array.isArray(params.id) ? params.id[0] : "";
  const [data, setData] = useState<ReviewData | null>(null);
  const [loading, setLoading] = useState(!!id);
  const [infoChecked, setInfoChecked] = useState(false);
  const [docsChecked, setDocsChecked] = useState(false);
  const [acting, setActing] = useState<"approve" | "reject" | null>(null);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const res = await apiClient.get<ReviewData>(`/api/admin/listings/${id}`);
      setData(res);
    } catch (err) {
      if (err instanceof ApiClientError && (err.status === 401 || err.status === 403)) {
        router.replace("/");
        return;
      }
      if (err instanceof ApiClientError && err.status === 404) {
        setData(null);
        return;
      }
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [id, router]);

  useEffect(() => {
    void load();
  }, [load]);

  const approve = async () => {
    if (!id || data?.status !== "PENDING") return;
    setActing("approve");
    try {
      await apiClient.post(`/api/admin/approvals/${id}/approve`);
      router.replace("/admin/listings?status=PENDING");
    } finally {
      setActing(null);
    }
  };

  const reject = async () => {
    if (!id || data?.status !== "PENDING") return;
    setActing("reject");
    try {
      await apiClient.post(`/api/admin/approvals/${id}/reject`);
      router.replace("/admin/listings?status=PENDING");
    } finally {
      setActing(null);
    }
  };

  if (loading) {
    return (
      <div className="rounded-2xl border border-neutral-200 bg-white p-8 text-center text-neutral-500">
        불러오는 중...
      </div>
    );
  }
  if (!data) {
    return (
      <div className="rounded-2xl border border-neutral-200 bg-white p-8 text-center">
        <p className="text-neutral-600">숙소를 찾을 수 없습니다.</p>
        <Link href="/admin/listings" className="mt-4 inline-block text-sm font-medium text-neutral-900 underline">
          목록으로
        </Link>
      </div>
    );
  }

  const canApprove = data.status === "PENDING" && infoChecked && docsChecked;

  return (
    <div className="grid gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link href="/admin/listings" className="text-sm font-medium text-neutral-600 hover:text-neutral-900">
            ← 숙소 목록
          </Link>
          <h1 className="mt-2 text-2xl font-extrabold tracking-tight">숙소 검토</h1>
          <p className="mt-1 text-sm text-neutral-500">
            {data.title} · {STATUS_LABEL[data.status] ?? data.status}
          </p>
        </div>
      </div>

      {/* 숙소 정보 */}
      <section className="rounded-2xl border border-neutral-200 bg-white p-6">
        <h2 className="text-lg font-semibold text-neutral-900">숙소 정보</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <p className="text-xs font-medium text-neutral-500">제목</p>
            <p className="text-neutral-900">{data.title}</p>
            {(data.titleKo || data.titleJa || data.titleZh) && (
              <p className="mt-1 text-sm text-neutral-600">
                {[data.titleKo, data.titleJa, data.titleZh].filter(Boolean).join(" / ")}
              </p>
            )}
          </div>
          <div>
            <p className="text-xs font-medium text-neutral-500">주소</p>
            <p className="text-neutral-900">{data.address}</p>
            {(data.roadAddress || data.detailedAddress) && (
              <p className="mt-1 text-sm text-neutral-600">
                {[data.roadAddress, data.detailedAddress].filter(Boolean).join(" ")}
              </p>
            )}
            {data.zipCode && <p className="text-sm text-neutral-500">우편 {data.zipCode}</p>}
          </div>
          <div>
            <p className="text-xs font-medium text-neutral-500">지역</p>
            <p className="text-neutral-900">{data.city} · {data.area}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-neutral-500">기본 요금</p>
            <p className="text-neutral-900">₩{data.basePriceKrw.toLocaleString()}/박</p>
            {data.extraGuestFeeKrw != null && data.extraGuestFeeKrw > 0 && (
              <p className="text-sm text-neutral-500">추가 인원 ₩{data.extraGuestFeeKrw.toLocaleString()}/인</p>
            )}
          </div>
          <div>
            <p className="text-xs font-medium text-neutral-500">숙소 유형 · 수용 인원</p>
            <p className="text-neutral-900">
              {data.propertyType ?? "-"} · 최대 {data.maxGuests ?? "-"}명 · 침실 {data.bedrooms ?? "-"} · 침대 {data.beds ?? "-"} · 욕실 {data.bathrooms ?? "-"}
            </p>
          </div>
          <div>
            <p className="text-xs font-medium text-neutral-500">체크인/아웃</p>
            <p className="text-neutral-900">{data.checkInTime} / {data.checkOutTime ?? "-"}</p>
          </div>
        </div>
        {data.amenities.length > 0 && (
          <div className="mt-4">
            <p className="text-xs font-medium text-neutral-500">편의시설</p>
            <p className="text-neutral-700">{data.amenities.join(", ")}</p>
          </div>
        )}
        {(data.houseRulesMessage || data.checkInGuideMessage) && (
          <div className="mt-4 space-y-2">
            {data.houseRulesMessage && (
              <div>
                <p className="text-xs font-medium text-neutral-500">이용 규칙</p>
                <p className="whitespace-pre-wrap text-sm text-neutral-700">{data.houseRulesMessage}</p>
              </div>
            )}
            {data.checkInGuideMessage && (
              <div>
                <p className="text-xs font-medium text-neutral-500">체크인 안내</p>
                <p className="whitespace-pre-wrap text-sm text-neutral-700">{data.checkInGuideMessage}</p>
              </div>
            )}
          </div>
        )}
        {data.images.length > 0 && (
          <div className="mt-4">
            <p className="mb-2 text-xs font-medium text-neutral-500">등록 사진</p>
            <div className="flex flex-wrap gap-2">
              {data.images.slice(0, 8).map((img) => (
                <a key={img.id} href={img.url} target="_blank" rel="noopener noreferrer" className="block h-24 w-32 overflow-hidden rounded-lg border border-neutral-200">
                  <Image src={img.url} alt="" width={128} height={96} className="h-full w-full object-cover" unoptimized />
                </a>
              ))}
              {data.images.length > 8 && <span className="flex items-center text-sm text-neutral-500">+{data.images.length - 8}장</span>}
            </div>
          </div>
        )}
      </section>

      {/* 호스트 정보 */}
      <section className="rounded-2xl border border-neutral-200 bg-white p-6">
        <h2 className="text-lg font-semibold text-neutral-900">호스트 정보</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <p className="text-xs font-medium text-neutral-500">이름</p>
            <p className="text-neutral-900">{(data.host.displayName || data.host.name) ?? "-"}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-neutral-500">이메일</p>
            <p className="text-neutral-900">{data.host.email ?? "-"}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-neutral-500">연락처</p>
            <p className="text-neutral-900">{data.host.phone ?? "-"}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-neutral-500">호스트 ID</p>
            <p className="font-mono text-sm text-neutral-600">{data.host.id}</p>
          </div>
          {data.hostProfile && (
            <>
              <div>
                <p className="text-xs font-medium text-neutral-500">정산 은행</p>
                <p className="text-neutral-900">{data.hostProfile.payoutBank ?? "-"}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-neutral-500">정산 계좌</p>
                <p className="text-neutral-900">{data.hostProfile.payoutAccount ?? "-"}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-neutral-500">예금주</p>
                <p className="text-neutral-900">{data.hostProfile.payoutName ?? "-"}</p>
              </div>
            </>
          )}
        </div>
        {(data.hostBio || data.hostBioKo) && (
          <div className="mt-4">
            <p className="text-xs font-medium text-neutral-500">호스트 소개</p>
            <p className="whitespace-pre-wrap text-sm text-neutral-700">{(data.hostBioKo || data.hostBio || data.hostBioJa || data.hostBioZh) ?? "-"}</p>
          </div>
        )}
      </section>

      {/* 제출 서류 */}
      <section className="rounded-2xl border border-neutral-200 bg-white p-6">
        <h2 className="text-lg font-semibold text-neutral-900">제출 서류</h2>
        <p className="mt-1 text-sm text-neutral-500">호스트가 업로드한 서류를 확인한 뒤 아래 체크박스를 선택하세요.</p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <DocBlock label="사업자등록증" url={data.businessRegistrationDocUrl} />
          <DocBlock label="민박업 신고증 / 외국어관광도시민박업 지정증" url={data.lodgingReportDocUrl} />
        </div>
      </section>

      {/* 검토 완료 체크 + 승인/거절 */}
      <section className="rounded-2xl border border-neutral-200 bg-white p-6">
        <h2 className="text-lg font-semibold text-neutral-900">검토 완료 후 승인</h2>
        <p className="mt-1 text-sm text-neutral-500">호스트·숙소 정보와 서류를 확인한 뒤 두 항목을 체크하고 승인하세요.</p>
        <div className="mt-4 flex flex-wrap items-center gap-6">
          <label className="flex cursor-pointer items-center gap-2">
            <input
              type="checkbox"
              checked={infoChecked}
              onChange={(e) => setInfoChecked(e.target.checked)}
              className="h-4 w-4 rounded border-neutral-300"
            />
            <span className="text-sm font-medium text-neutral-800">호스트·숙소 정보 검토 완료</span>
          </label>
          <label className="flex cursor-pointer items-center gap-2">
            <input
              type="checkbox"
              checked={docsChecked}
              onChange={(e) => setDocsChecked(e.target.checked)}
              className="h-4 w-4 rounded border-neutral-300"
            />
            <span className="text-sm font-medium text-neutral-800">서류 확인 완료</span>
          </label>
        </div>
        {data.status === "PENDING" && (
          <div className="mt-6 flex gap-3">
            <button
              type="button"
              disabled={!canApprove || acting !== null}
              onClick={() => void approve()}
              className="rounded-xl bg-neutral-900 px-4 py-2.5 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {acting === "approve" ? "처리 중..." : "승인"}
            </button>
            <button
              type="button"
              disabled={acting !== null}
              onClick={() => void reject()}
              className="rounded-xl border border-red-300 bg-white px-4 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50"
            >
              {acting === "reject" ? "처리 중..." : "거절"}
            </button>
            {!canApprove && infoChecked && !docsChecked && (
              <span className="flex items-center text-sm text-amber-600">서류 확인 완료를 체크해 주세요.</span>
            )}
            {!canApprove && docsChecked && !infoChecked && (
              <span className="flex items-center text-sm text-amber-600">정보 검토 완료를 체크해 주세요.</span>
            )}
            {!canApprove && !infoChecked && !docsChecked && (
              <span className="flex items-center text-sm text-neutral-500">두 항목을 모두 체크하면 승인할 수 있습니다.</span>
            )}
          </div>
        )}
        {data.status !== "PENDING" && (
          <p className="mt-4 text-sm text-neutral-500">이 숙소는 이미 {STATUS_LABEL[data.status] ?? data.status} 상태입니다.</p>
        )}
      </section>
    </div>
  );
}
