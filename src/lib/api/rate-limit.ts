import { apiError } from "@/lib/api/response";

type RateLimitEntry = { count: number; resetAt: number };

const stores = new Map<string, Map<string, RateLimitEntry>>();

const CLEANUP_INTERVAL_MS = 60_000;
let lastCleanup = Date.now();

function cleanupStaleEntries() {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL_MS) return;
  lastCleanup = now;

  for (const store of stores.values()) {
    for (const [key, entry] of store) {
      if (now >= entry.resetAt) store.delete(key);
    }
  }
}

function getStore(name: string) {
  let store = stores.get(name);
  if (!store) {
    store = new Map();
    stores.set(name, store);
  }
  return store;
}

export type RateLimitConfig = {
  name: string;
  windowMs: number;
  max: number;
};

export const RATE_LIMITS = {
  api: { name: "api", windowMs: 60_000, max: 100 } satisfies RateLimitConfig,
  auth: { name: "auth", windowMs: 60_000, max: 20 } satisfies RateLimitConfig,
  mutation: { name: "mutation", windowMs: 60_000, max: 30 } satisfies RateLimitConfig,
  upload: { name: "upload", windowMs: 60_000, max: 10 } satisfies RateLimitConfig,
} as const;

export function checkRateLimit(
  key: string,
  config: RateLimitConfig
): { allowed: boolean; remaining: number; resetAt: number } {
  cleanupStaleEntries();

  const store = getStore(config.name);
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || now >= entry.resetAt) {
    store.set(key, { count: 1, resetAt: now + config.windowMs });
    return { allowed: true, remaining: config.max - 1, resetAt: now + config.windowMs };
  }

  entry.count++;
  const remaining = Math.max(0, config.max - entry.count);

  if (entry.count > config.max) {
    return { allowed: false, remaining: 0, resetAt: entry.resetAt };
  }

  return { allowed: true, remaining, resetAt: entry.resetAt };
}

export function rateLimitResponse() {
  return apiError(429, "BAD_REQUEST", "Too many requests. Please try again later.");
}

export function getClientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  const real = req.headers.get("x-real-ip");
  if (real) return real;
  return "unknown";
}
