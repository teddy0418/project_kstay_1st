import React from "react";
import { notFound } from "next/navigation";
import ListingsE2ERunnerImport from "@/components/host/tools/ListingsE2ERunner";

const ListingsE2ERunner = ListingsE2ERunnerImport as React.ComponentType;

const IS_PRODUCTION = process.env.NODE_ENV === "production";
const ENV_DIAG_ENABLED =
  process.env.ENABLE_HOST_LISTINGS_DIAGNOSTICS === "true" ||
  process.env.NEXT_PUBLIC_ENABLE_HOST_LISTINGS_DIAGNOSTICS === "true";

export default function HostListingsE2EPage() {
  if (IS_PRODUCTION) {
    notFound();
  }
  if (!ENV_DIAG_ENABLED) {
    return (
      <div className="mx-auto max-w-2xl p-8 text-center">
        <h1 className="text-xl font-semibold text-neutral-800">진단 페이지 비활성화</h1>
        <p className="mt-4 text-sm text-neutral-600">
          이 페이지는 <code className="rounded bg-neutral-100 px-1">ENABLE_HOST_LISTINGS_DIAGNOSTICS</code> 또는{" "}
          <code className="rounded bg-neutral-100 px-1">NEXT_PUBLIC_ENABLE_HOST_LISTINGS_DIAGNOSTICS</code>=true 일 때만 사용할 수 있습니다.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl p-6">
      <ListingsE2ERunner />
    </div>
  );
}
