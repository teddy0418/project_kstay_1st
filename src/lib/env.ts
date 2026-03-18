/**
 * Runtime environment variable validation.
 * Import this from instrumentation.ts or any server entry point
 * so missing variables surface immediately instead of causing
 * cryptic failures deep in business logic.
 */

type EnvRule = {
  key: string;
  required: boolean;
  fallbackKeys?: string[];
  warnOnly?: boolean;
};

const rules: EnvRule[] = [
  { key: "DATABASE_URL", required: true, fallbackKeys: ["POSTGRES_PRISMA_URL"] },
  { key: "AUTH_SECRET", required: true, fallbackKeys: ["NEXTAUTH_SECRET"] },
  { key: "GOOGLE_CLIENT_ID", required: true },
  { key: "GOOGLE_CLIENT_SECRET", required: true },
  { key: "CRON_SECRET", required: true },
  { key: "PORTONE_API_SECRET", required: false, warnOnly: true },
  { key: "PORTONE_WEBHOOK_SECRET", required: false, warnOnly: true },
  { key: "RESEND_API_KEY", required: false, warnOnly: true },
  { key: "ADMIN_EMAILS", required: false, warnOnly: true },
];

function resolve(rule: EnvRule): string | undefined {
  const val = process.env[rule.key];
  if (val) return val;
  for (const alt of rule.fallbackKeys ?? []) {
    if (process.env[alt]) return process.env[alt];
  }
  return undefined;
}

export function validateEnv() {
  const missing: string[] = [];
  const warnings: string[] = [];

  for (const rule of rules) {
    if (resolve(rule)) continue;

    const label = rule.fallbackKeys?.length
      ? `${rule.key} (or ${rule.fallbackKeys.join("/")})`
      : rule.key;

    if (rule.required && !rule.warnOnly) {
      missing.push(label);
    } else if (rule.warnOnly) {
      warnings.push(label);
    }
  }

  if (warnings.length > 0) {
    console.warn(
      `[env] Optional env vars not set (some features disabled): ${warnings.join(", ")}`
    );
  }

  if (missing.length > 0) {
    const msg = `[env] Missing required environment variables:\n  - ${missing.join("\n  - ")}`;
    if (process.env.NODE_ENV === "production") {
      throw new Error(msg);
    }
    console.error(msg);
  }
}
