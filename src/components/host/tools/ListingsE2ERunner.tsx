"use client";

import { signIn, useSession } from "next-auth/react";
import { usePathname, useSearchParams } from "next/navigation";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { apiClient, ApiClientError } from "@/lib/api/client";

type StepStatus = "pending" | "running" | "pass" | "fail";

function failureCategoryFromStatus(statusCode: number): string {
  if (statusCode === 401) return "로그인/세션 문제";
  if (statusCode === 403) return "역할/소유권 문제 (세션 갱신 필요 가능)";
  if (statusCode === 400) return "validation/payload 문제";
  if (statusCode >= 500) return "서버/Prisma/DB 문제";
  return "기타";
}

type StepResult = {
  label: string;
  status: StepStatus;
  statusCode?: number;
  failureCategory?: string;
  error?: { code: string; message: string };
  data?: unknown;
};

const AUTOSTART_KEY = "kstay_diag_autostart";
const DEFAULT_IMAGE_URL_1 = "https://picsum.photos/seed/kstay1/800/600";
const DEFAULT_IMAGE_URL_2 = "https://picsum.photos/seed/kstay2/800/600";

export default function ListingsE2ERunner() {
  const { data: session, status: sessionStatus, update: updateSession } = useSession();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const autostartFromUrl = searchParams.get("autostart") === "1";
  const callbackUrl = pathname ? `${pathname}?autostart=1` : "/host/tools/listings-e2e?autostart=1";

  const [steps, setSteps] = useState<StepResult[]>([]);
  const [running, setRunning] = useState(false);
  const [listingId, setListingId] = useState<string | null>(null);
  const [imageIds, setImageIds] = useState<string[]>([]);
  const [revertToDraft, setRevertToDraft] = useState(true);
  const [imageUrl1, setImageUrl1] = useState(DEFAULT_IMAGE_URL_1);
  const [imageUrl2, setImageUrl2] = useState(DEFAULT_IMAGE_URL_2);
  const [resultJson, setResultJson] = useState<string>("");
  const hasAutostartedRef = useRef(false);

  // Set sessionStorage when user lands with ?autostart=1
  useEffect(() => {
    if (autostartFromUrl && typeof sessionStorage !== "undefined") {
      sessionStorage.setItem(AUTOSTART_KEY, "1");
    }
  }, [autostartFromUrl]);

  const shouldAutostart =
    autostartFromUrl || (typeof sessionStorage !== "undefined" && sessionStorage.getItem(AUTOSTART_KEY) === "1");

  const setStep = useCallback((index: number, update: Partial<StepResult>) => {
    setSteps((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], ...update };
      return next;
    });
  }, []);

  const setResultFromSteps = useCallback((stepsSnapshot: StepResult[], lid: string | null, iids: string[]) => {
    const firstFail = stepsSnapshot.find((s) => s.status === "fail");
    const summary = firstFail?.statusCode
      ? { allPass: false, failureCategory: failureCategoryFromStatus(firstFail.statusCode), failedStep: firstFail.label }
      : { allPass: true };
    setResultJson(JSON.stringify({ summary, listingId: lid, imageIds: iids, steps: stepsSnapshot }, null, 2));
  }, []);

  const run = useCallback(async () => {
    if (sessionStatus !== "authenticated" || !session?.user) {
      return;
    }
    const role = (session.user as { role?: string }).role;
    if (role !== "HOST" && role !== "ADMIN") {
      const stepResults: StepResult[] = [
        { label: "세션 검사", status: "fail", failureCategory: "역할/소유권 문제 (세션 갱신 필요 가능)", error: { code: "FORBIDDEN", message: "HOST 또는 ADMIN만 실행할 수 있습니다." } },
      ];
      setSteps(stepResults);
      setResultFromSteps(stepResults, null, []);
      return;
    }

    const stepLabels = [
      "1) POST /api/host/listings (DRAFT)",
      "2) PATCH /api/host/listings/[id] (checkIn/Out)",
      "3) 이미지 POST #1",
      "4) 이미지 POST #2",
      "5) 이미지 reorder",
      "6) 이미지 DELETE 1개",
      "7) PATCH status=PENDING",
      "8) GET /api/host/listings/[id]",
    ];
    const stepsSnapshot: StepResult[] = stepLabels.map((label) => ({ label, status: "pending" as StepStatus }));
    setSteps(stepsSnapshot);
    setRunning(true);
    setListingId(null);
    setImageIds([]);
    if (typeof sessionStorage !== "undefined") sessionStorage.removeItem(AUTOSTART_KEY);

    let id: string | null = null;
    const imgIds: string[] = [];

    const applyStep = (index: number, update: Partial<StepResult>) => {
      stepsSnapshot[index] = { ...stepsSnapshot[index], ...update };
      setStep(index, update);
    };

    try {
      // 1) POST create DRAFT
      applyStep(0, { status: "running" });
      const created = await apiClient.post<{ id: string; status: string }>("/api/host/listings", {
        title: "[DIAG] E2E Test Listing",
        titleKo: "[DIAG] E2E 테스트",
        city: "Seoul",
        area: "Jongno",
        address: "Jongno-gu Diagnostic",
        basePriceKrw: 100000,
        checkInTime: "15:00",
        checkOutTime: "11:00",
        status: "DRAFT",
      });
      id = created?.id ?? null;
      if (!id) throw new Error("No id in response");
      setListingId(id);
      applyStep(0, { status: "pass", statusCode: 201, data: { id: created.id, status: created.status } });
      await updateSession();
    } catch (e) {
      const err = e instanceof ApiClientError ? e : null;
      const statusCode = err?.status ?? 500;
      applyStep(0, {
        status: "fail",
        statusCode,
        failureCategory: failureCategoryFromStatus(statusCode),
        error: { code: err?.code ?? "ERROR", message: e instanceof Error ? e.message : String(e) },
      });
      setRunning(false);
      setResultFromSteps(stepsSnapshot, id, imgIds);
      return;
    }

    const with403Retry = async <T,>(stepIndex: number, fn: () => Promise<T>): Promise<T> => {
      try {
        return await fn();
      } catch (e) {
        const err = e instanceof ApiClientError ? e : null;
        if (err?.status === 403) {
          await updateSession();
          return await fn();
        }
        throw e;
      }
    };

    try {
      applyStep(1, { status: "running" });
      await with403Retry(1, () =>
        apiClient.patch(`/api/host/listings/${id}`, { checkInTime: "14:00", checkOutTime: "10:00" })
      );
      applyStep(1, { status: "pass", statusCode: 200 });
    } catch (e) {
      const err = e instanceof ApiClientError ? e : null;
      const statusCode = err?.status ?? 500;
      applyStep(1, { status: "fail", statusCode, failureCategory: failureCategoryFromStatus(statusCode), error: { code: err?.code ?? "ERROR", message: e instanceof Error ? e.message : String(e) } });
      setRunning(false);
      setResultFromSteps(stepsSnapshot, id, imgIds);
      return;
    }

    try {
      applyStep(2, { status: "running" });
      const img1 = await with403Retry(2, () =>
        apiClient.post<{ id: string; url: string; sortOrder: number }>(`/api/host/listings/${id}/images`, { url: imageUrl1 })
      );
      imgIds.push(img1.id);
      setImageIds([...imgIds]);
      applyStep(2, { status: "pass", statusCode: 201, data: { imageId: img1.id } });
    } catch (e) {
      const err = e instanceof ApiClientError ? e : null;
      const statusCode = err?.status ?? 500;
      applyStep(2, { status: "fail", statusCode, failureCategory: failureCategoryFromStatus(statusCode), error: { code: err?.code ?? "ERROR", message: e instanceof Error ? e.message : String(e) } });
      setRunning(false);
      setResultFromSteps(stepsSnapshot, id, imgIds);
      return;
    }

    try {
      applyStep(3, { status: "running" });
      const img2 = await with403Retry(3, () =>
        apiClient.post<{ id: string; url: string; sortOrder: number }>(`/api/host/listings/${id}/images`, { url: imageUrl2 })
      );
      imgIds.push(img2.id);
      setImageIds([...imgIds]);
      applyStep(3, { status: "pass", statusCode: 201, data: { imageId: img2.id } });
    } catch (e) {
      const err = e instanceof ApiClientError ? e : null;
      const statusCode = err?.status ?? 500;
      applyStep(3, { status: "fail", statusCode, failureCategory: failureCategoryFromStatus(statusCode), error: { code: err?.code ?? "ERROR", message: e instanceof Error ? e.message : String(e) } });
      setRunning(false);
      setResultFromSteps(stepsSnapshot, id, imgIds);
      return;
    }

    try {
      applyStep(4, { status: "running" });
      await with403Retry(4, () =>
        apiClient.patch(`/api/host/listings/${id}/images/reorder`, { imageIds: [...imgIds].reverse() })
      );
      applyStep(4, { status: "pass", statusCode: 200 });
    } catch (e) {
      const err = e instanceof ApiClientError ? e : null;
      const statusCode = err?.status ?? 500;
      applyStep(4, { status: "fail", statusCode, failureCategory: failureCategoryFromStatus(statusCode), error: { code: err?.code ?? "ERROR", message: e instanceof Error ? e.message : String(e) } });
      setRunning(false);
      setResultFromSteps(stepsSnapshot, id, imgIds);
      return;
    }

    try {
      applyStep(5, { status: "running" });
      await with403Retry(5, () => apiClient.delete(`/api/host/listings/${id}/images/${imgIds[0]}`));
      applyStep(5, { status: "pass", statusCode: 200 });
    } catch (e) {
      const err = e instanceof ApiClientError ? e : null;
      const statusCode = err?.status ?? 500;
      applyStep(5, { status: "fail", statusCode, failureCategory: failureCategoryFromStatus(statusCode), error: { code: err?.code ?? "ERROR", message: e instanceof Error ? e.message : String(e) } });
      setRunning(false);
      setResultFromSteps(stepsSnapshot, id, imgIds);
      return;
    }

    try {
      applyStep(6, { status: "running" });
      await with403Retry(6, () => apiClient.patch(`/api/host/listings/${id}`, { status: "PENDING" }));
      applyStep(6, { status: "pass", statusCode: 200 });
    } catch (e) {
      const err = e instanceof ApiClientError ? e : null;
      const statusCode = err?.status ?? 500;
      applyStep(6, { status: "fail", statusCode, failureCategory: failureCategoryFromStatus(statusCode), error: { code: err?.code ?? "ERROR", message: e instanceof Error ? e.message : String(e) } });
      setRunning(false);
      setResultFromSteps(stepsSnapshot, id, imgIds);
      return;
    }

    try {
      applyStep(7, { status: "running" });
      const listing = await with403Retry(7, () =>
        apiClient.get<{ id: string; status: string; images?: { id: string; url: string; sortOrder: number }[] }>(`/api/host/listings/${id}`)
      );
      const imageCount = listing?.images?.length ?? 0;
      applyStep(7, { status: "pass", statusCode: 200, data: { imageCount, status: listing?.status } });
    } catch (e) {
      const err = e instanceof ApiClientError ? e : null;
      const statusCode = err?.status ?? 500;
      applyStep(7, { status: "fail", statusCode, failureCategory: failureCategoryFromStatus(statusCode), error: { code: err?.code ?? "ERROR", message: e instanceof Error ? e.message : String(e) } });
      setRunning(false);
      setResultFromSteps(stepsSnapshot, id, imgIds);
      return;
    }

    if (revertToDraft && id) {
      try {
        await apiClient.patch(`/api/host/listings/${id}`, { status: "DRAFT" });
      } catch {
        // ignore
      }
    }

    setRunning(false);
    setResultFromSteps(stepsSnapshot, id, imgIds);
  }, [session, sessionStatus, setStep, setResultFromSteps, updateSession, revertToDraft, imageUrl1, imageUrl2]);

  // Autostart when session ready and flag set
  useEffect(() => {
    if (sessionStatus !== "authenticated" || !session?.user || running) return;
    const role = (session.user as { role?: string }).role;
    if (role !== "HOST" && role !== "ADMIN") return;
    if (!shouldAutostart || hasAutostartedRef.current) return;
    hasAutostartedRef.current = true;
    void run();
  }, [session, sessionStatus, running, shouldAutostart, run]);

  if (sessionStatus === "loading") {
    return (
      <div className="rounded-2xl border border-neutral-200 bg-white p-8 text-center text-neutral-600">
        세션 확인 중…
      </div>
    );
  }

  if (sessionStatus !== "authenticated" || !session?.user) {
    return (
      <div className="rounded-2xl border border-neutral-200 bg-white p-8 text-center">
        <h1 className="text-lg font-semibold">호스트 리스팅 E2E 진단</h1>
        {shouldAutostart ? (
          <>
            <p className="mt-6 text-lg font-medium text-neutral-800">로그인 후 자동으로 진단이 실행됩니다.</p>
            <p className="mt-2 text-sm text-neutral-600">아래 버튼으로 로그인하면 이 페이지로 돌아와 진단이 자동 실행됩니다.</p>
            <button
              type="button"
              onClick={() => void signIn(undefined, { callbackUrl })}
              className="mt-6 rounded-2xl bg-neutral-900 px-6 py-3 text-sm font-medium text-white hover:bg-neutral-800"
            >
              로그인
            </button>
          </>
        ) : (
          <p className="mt-4 text-sm text-neutral-600">로그인한 뒤 이 페이지를 다시 열어주세요.</p>
        )}
      </div>
    );
  }

  const role = (session.user as { role?: string }).role;
  if (role !== "HOST" && role !== "ADMIN") {
    return (
      <div className="rounded-2xl border border-neutral-200 bg-white p-8 text-center">
        <h1 className="text-lg font-semibold">호스트 리스팅 E2E 진단</h1>
        <p className="mt-4 text-sm text-neutral-600">HOST 또는 ADMIN 계정으로 로그인해주세요.</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-8 shadow-sm">
      <h1 className="text-xl font-semibold">호스트 리스팅 E2E 진단</h1>
      <p className="mt-2 text-sm text-neutral-600">
        API 단계별 호출 후 PASS/FAIL을 표시합니다. 생성된 리스팅은 제목에 [DIAG]가 붙으며, 삭제 API가 없어 DB에 남습니다.
      </p>

      <div className="mt-6 flex flex-wrap gap-4">
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium">이미지 URL 1</label>
          <input
            type="url"
            value={imageUrl1}
            onChange={(e) => setImageUrl1(e.target.value)}
            disabled={running}
            className="min-w-[200px] rounded-xl border border-neutral-200 px-3 py-2 text-sm"
          />
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium">이미지 URL 2</label>
          <input
            type="url"
            value={imageUrl2}
            onChange={(e) => setImageUrl2(e.target.value)}
            disabled={running}
            className="min-w-[200px] rounded-xl border border-neutral-200 px-3 py-2 text-sm"
          />
        </div>
      </div>

      <div className="mt-4 flex items-center gap-2">
        <input
          type="checkbox"
          id="revert-draft"
          checked={revertToDraft}
          onChange={(e) => setRevertToDraft(e.target.checked)}
          disabled={running}
        />
        <label htmlFor="revert-draft" className="text-sm">
          마지막에 status를 DRAFT로 되돌리기 (기본 권장)
        </label>
      </div>

      <button
        type="button"
        onClick={() => void run()}
        disabled={running}
        className="mt-6 rounded-2xl bg-neutral-900 px-6 py-3 text-sm font-medium text-white hover:bg-neutral-800 disabled:opacity-50"
      >
        {running ? "실행 중…" : "진단 실행"}
      </button>

      <div className="mt-8 space-y-4">
        {steps.map((step, i) => (
          <div key={i} className="rounded-xl border border-neutral-200 bg-neutral-50/50 p-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-medium text-neutral-900">{step.label}</span>
              <span
                className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                  step.status === "pass"
                    ? "bg-green-100 text-green-800"
                    : step.status === "fail"
                      ? "bg-red-100 text-red-800"
                      : step.status === "running"
                        ? "bg-amber-100 text-amber-800"
                        : "bg-neutral-200 text-neutral-600"
                }`}
              >
                {step.status === "pending" ? "대기" : step.status === "running" ? "진행중" : step.status === "pass" ? "PASS" : "FAIL"}
              </span>
              {step.statusCode != null && (
                <span className="text-xs text-neutral-500">HTTP {step.statusCode}</span>
              )}
            </div>
            {step.status === "fail" && step.error && (
              <>
                {step.failureCategory && (
                  <p className="mt-2 text-sm font-medium text-amber-800">분류: {step.failureCategory}</p>
                )}
                <p className="mt-1 text-sm text-red-700">
                  {step.error.code}: {step.error.message}
                </p>
              </>
            )}
            {step.status === "pass" && step.data != null && (
              <p className="mt-2 text-xs text-neutral-600">{JSON.stringify(step.data)}</p>
            )}
          </div>
        ))}
      </div>

      {listingId && (
        <div className="mt-6 rounded-xl border border-neutral-200 bg-white p-4 text-sm">
          <span className="font-medium">생성된 listingId:</span> {listingId}
          {imageIds.length > 0 && (
            <>
              <span className="ml-4 font-medium">imageIds:</span> {imageIds.join(", ")}
            </>
          )}
        </div>
      )}

      {resultJson && (
        <div className="mt-6">
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm font-medium">결과 JSON</span>
            <button
              type="button"
              onClick={() => {
                navigator.clipboard.writeText(resultJson);
              }}
              className="rounded-xl bg-neutral-100 px-4 py-2 text-sm font-medium text-neutral-800 hover:bg-neutral-200"
            >
              Copy JSON
            </button>
          </div>
          <textarea
            readOnly
            value={resultJson}
            rows={12}
            className="mt-2 w-full rounded-xl border border-neutral-200 bg-neutral-50 p-3 font-mono text-xs text-neutral-700"
          />
        </div>
      )}
    </div>
  );
}
