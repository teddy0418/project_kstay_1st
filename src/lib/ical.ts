import { async as ical } from "node-ical";

/**
 * iCal URL을 가져와서 이벤트가 있는 날짜를 차단일 키("YYYY-MM-DD") 배열로 반환합니다.
 * 호스트 캘린더의 외부 캘린더(iCal) 동기화에서 사용합니다.
 */
export async function fetchIcalBlockedDates(url: string): Promise<string[]> {
  const rawEvents: unknown = await (ical as unknown as { fromURL: (u: string, o: unknown) => Promise<unknown> }).fromURL(
    url.trim(),
    {}
  );
  const keys = new Set<string>();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const values =
    rawEvents && typeof rawEvents === "object"
      ? Object.values(rawEvents as Record<string, { type?: string; start?: unknown; end?: unknown }>)
      : [];

  for (const value of values) {
    if (!value || value.type !== "VEVENT") continue;
    const start = value.start instanceof Date ? value.start : null;
    const end = value.end instanceof Date ? value.end : null;
    if (!start || !end) continue;

    const cursor = new Date(start.getFullYear(), start.getMonth(), start.getDate());
    const last = new Date(end.getFullYear(), end.getMonth(), end.getDate());

    while (cursor <= last) {
      if (cursor >= today) {
        keys.add(
          `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, "0")}-${String(cursor.getDate()).padStart(2, "0")}`
        );
      }
      cursor.setDate(cursor.getDate() + 1);
    }
  }

  return Array.from(keys).sort();
}
