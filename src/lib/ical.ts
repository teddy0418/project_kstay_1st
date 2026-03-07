/** 실서비스: https만 허용, 개발환경에서만 http 허용 */
export function isAllowedIcalUrl(url: string): boolean {
  const trimmed = url.trim();
  if (!trimmed) return false;
  try {
    const u = new URL(trimmed);
    return u.protocol === "https:" || (process.env.NODE_ENV === "development" && u.protocol === "http:");
  } catch {
    return false;
  }
}

const DEFAULT_ICAL_TIMEOUT_MS = 20_000;

/** node-ical 파싱 결과에서 VEVENT 기준 차단일 YYYY-MM-DD(UTC) 배열로 변환. 1년 초과분 제외. */
export function parseRawEventsToBlockedYmd(rawEvents: unknown): string[] {
  const keys = new Set<string>();
  const now = new Date();
  const todayUtc = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const oneYearLaterUtc = new Date(
    Date.UTC(now.getUTCFullYear() + 1, now.getUTCMonth(), now.getUTCDate())
  );

  const values =
    rawEvents && typeof rawEvents === "object"
      ? Object.values(rawEvents as Record<string, { type?: string; start?: unknown; end?: unknown }>)
      : [];

  for (const value of values) {
    if (!value || value.type !== "VEVENT") continue;
    const start = value.start instanceof Date ? value.start : null;
    const end = value.end instanceof Date ? value.end : null;
    if (!start || !end) continue;

    let cursor = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate()));
    const last = new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), end.getUTCDate()));

    while (cursor < last && cursor <= oneYearLaterUtc) {
      if (cursor >= todayUtc) {
        keys.add(
          `${cursor.getUTCFullYear()}-${String(cursor.getUTCMonth() + 1).padStart(2, "0")}-${String(cursor.getUTCDate()).padStart(2, "0")}`
        );
      }
      cursor.setUTCDate(cursor.getUTCDate() + 1);
    }
  }

  return Array.from(keys).sort();
}

/**
 * iCal URL을 가져와서 이벤트가 있는 날짜를 차단일 키("YYYY-MM-DD", UTC 기준) 배열로 반환합니다.
 * - 날짜는 UTC로 해석. iCal 규격상 DTEND은 exclusive로 처리합니다.
 * - node-ical은 런타임에만 로드 (빌드 시 BigInt 등 호환 이슈 회피).
 */
export async function fetchIcalBlockedDates(url: string): Promise<string[]> {
  const { async: ical } = await import("node-ical");
  const rawEvents: unknown = await ical.fromURL(url.trim(), {});
  return parseRawEventsToBlockedYmd(rawEvents);
}

/** 타임아웃 적용. 실서비스에서 외부 iCal 지연/무응답 방지. */
export async function fetchIcalBlockedDatesWithTimeout(
  url: string,
  timeoutMs: number = DEFAULT_ICAL_TIMEOUT_MS
): Promise<string[]> {
  const { async: ical } = await import("node-ical");
  const fetchPromise = ical.fromURL(url.trim(), {});
  const timeoutPromise = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error("TIMEOUT")), timeoutMs)
  );
  const rawEvents = await Promise.race([fetchPromise, timeoutPromise]);
  return parseRawEventsToBlockedYmd(rawEvents);
}
