function parseISODateUTC(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(y, (m ?? 1) - 1, d ?? 1));
}

/** Number of nights between two dates (Date or YYYY-MM-DD). Use for display; for business logic prefer nightsBetween. */
export function diffNights(startISO: string, endISO: string) {
  if (!startISO || !endISO) return 0;
  const start = parseISODateUTC(startISO);
  const end = parseISODateUTC(endISO);
  return nightsBetween(start, end);
}

/** Nights between two dates (inclusive of start, exclusive of end). */
export function nightsBetween(from: Date, to: Date) {
  const ms = to.getTime() - from.getTime();
  return Math.max(0, Math.round(ms / 86400000));
}

/** Parse YYYY-MM-DD as Date at UTC midnight. */
export function parseISODate(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(y ?? 0, (m ?? 1) - 1, d ?? 1));
}

/** Format date for display (e.g. "Jan 15, 2025"). */
export function formatDateEn(value: Date | string): string {
  const d = typeof value === "string" ? new Date(value) : value;
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(d);
}

/** Locale-aware date format. Use for guest-facing pages. Uses UTC to avoid off-by-one across timezones. */
export function formatDate(
  locale: string,
  value: Date | string,
  options: Intl.DateTimeFormatOptions = { month: "short", day: "numeric", year: "numeric" }
): string {
  const d = typeof value === "string" ? new Date(value) : value;
  return new Intl.DateTimeFormat(locale, { ...options, timeZone: "UTC" }).format(d);
}

/** Locale-aware date-time format (e.g. for message timestamps). */
export function formatDateTime(locale: string, value: Date | string): string {
  const d = typeof value === "string" ? new Date(value) : value;
  return new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(d);
}

export function addDays(d: Date, days: number): Date {
  const x = new Date(d);
  x.setDate(x.getDate() + days);
  return x;
}

export function formatDateRange(startISO: string, endISO: string) {
  const start = parseISODateUTC(startISO);
  const end = parseISODateUTC(endISO);

  const monthFmt = new Intl.DateTimeFormat("en-US", { month: "short", timeZone: "UTC" });
  const dayFmt = new Intl.DateTimeFormat("en-US", { day: "numeric", timeZone: "UTC" });

  const sameMonth =
    start.getUTCFullYear() === end.getUTCFullYear() && start.getUTCMonth() === end.getUTCMonth();

  if (sameMonth) {
    return `${monthFmt.format(start)} ${dayFmt.format(start)}–${dayFmt.format(end)}`;
  }
  return `${monthFmt.format(start)} ${dayFmt.format(start)} – ${monthFmt.format(end)} ${dayFmt.format(end)}`;
}

/** Locale-aware date range (e.g. "Jan 15–20" or "1월 15–20일"). */
export function formatDateRangeWithLocale(locale: string, startISO: string, endISO: string): string {
  const start = parseISODateUTC(startISO);
  const end = parseISODateUTC(endISO);
  const monthFmt = new Intl.DateTimeFormat(locale, { month: "short", timeZone: "UTC" });
  const dayFmt = new Intl.DateTimeFormat(locale, { day: "numeric", timeZone: "UTC" });
  const sameMonth =
    start.getUTCFullYear() === end.getUTCFullYear() && start.getUTCMonth() === end.getUTCMonth();
  if (sameMonth) {
    return `${monthFmt.format(start)} ${dayFmt.format(start)}–${dayFmt.format(end)}`;
  }
  return `${monthFmt.format(start)} ${dayFmt.format(start)} – ${monthFmt.format(end)} ${monthFmt.format(end)}`;
}

/** Locale-aware number format (e.g. 1,234 vs 1.234). */
export function formatNumber(locale: string, value: number, options?: Intl.NumberFormatOptions): string {
  return new Intl.NumberFormat(locale, options).format(value);
}

export function formatKRW(amount: number) {
  return `₩${new Intl.NumberFormat("en-US").format(Math.round(amount))}`;
}

/** Locale-aware KRW (숫자 구분만 선택 언어 적용). */
export function formatKRWWithLocale(locale: string, amount: number): string {
  return `₩${new Intl.NumberFormat(locale).format(Math.round(amount))}`;
}
