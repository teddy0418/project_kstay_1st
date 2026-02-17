/* eslint-disable no-restricted-globals */
import { NetworkOnly, Serwist, type PrecacheEntry } from "serwist";
import { defaultCache } from "@serwist/next/worker";

declare global {
  interface WorkerGlobalScope {
    __SW_MANIFEST: Array<PrecacheEntry | string>;
  }
}

declare const self: WorkerGlobalScope & typeof globalThis & {
  __SW_MANIFEST: Array<PrecacheEntry | string>;
};

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  runtimeCaching: [
    {
      matcher: ({ sameOrigin, url: { pathname } }) => sameOrigin && pathname.startsWith("/api/"),
      handler: new NetworkOnly(),
    },
    {
      matcher: ({ sameOrigin, url: { pathname } }) =>
        sameOrigin && (pathname === "/payment-redirect" || pathname.startsWith("/checkout/success/")),
      handler: new NetworkOnly(),
    },
    ...defaultCache,
  ],
});

serwist.addEventListeners();

serwist.setCatchHandler(async ({ request }) => {
  if (request.mode === "navigate") {
    const offlinePage = await caches.match("/offline");
    if (offlinePage) return offlinePage;
  }

  return Response.error();
});
