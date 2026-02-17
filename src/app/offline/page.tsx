import Link from "next/link";

export default function OfflinePage() {
  return (
    <main className="mx-auto flex min-h-[70vh] w-full max-w-xl flex-col items-center justify-center px-6 text-center">
      <h1 className="text-2xl font-bold tracking-tight">You are offline</h1>
      <p className="mt-3 text-sm text-neutral-600">
        Network connection is unavailable. Please reconnect and try again.
      </p>
      <Link
        href="/"
        className="mt-6 inline-flex rounded-xl bg-neutral-900 px-5 py-3 text-sm font-semibold text-white hover:opacity-95 transition"
      >
        Back to Home
      </Link>
    </main>
  );
}
