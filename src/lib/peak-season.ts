/**
 * KSTAY 표준 성수기 여부 (날짜 문자열 YYYY-MM-DD 기준).
 * 추후 확장: 공휴일·이벤트 기간 등 반영 가능.
 */
export function isPeakSeason(ymd: string): boolean {
  const [y, m, d] = ymd.split("-").map(Number);
  if (!y || !m || !d) return false;
  // 여름 성수기: 7/1 ~ 8/31
  if (m === 7 || m === 8) return true;
  // 연말 성수기: 12/20 ~ 12/31
  if (m === 12 && d >= 20) return true;
  // 설·연초: 1/1 ~ 1/5
  if (m === 1 && d <= 5) return true;
  return false;
}

/** YYYY-MM-DD 기준 금(5)·토(6) 주말 여부 (UTC 기준 요일 = 한국 날짜와 동일) */
export function isWeekend(ymd: string): boolean {
  const [y, m, d] = ymd.split("-").map(Number);
  if (!y || !m || !d) return false;
  const day = new Date(y, m - 1, d).getDay(); // 0=Sun, 5=Fri, 6=Sat
  return day === 5 || day === 6;
}
