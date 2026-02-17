function parseISODateUTC(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(y, (m ?? 1) - 1, d ?? 1));
}

export function formatDateRange(startISO: string, endISO: string) {
  const start = parseISODateUTC(startISO);
  const end = parseISODateUTC(endISO);

  const monthFmt = new Intl.DateTimeFormat("en-US", { month: "short", timeZone: "UTC" });
  const dayFmt = new Intl.DateTimeFormat("en-US", { day: "numeric", timeZone: "UTC" });

  const sameMonth =
    start.getUTCFullYear() === end.getUTCFullYear() && start.getUTCMonth() === end.getUTCMonth();

  if (sameMonth) {
    return `${monthFmt.format(start)} ${dayFmt.format(start)}??{dayFmt.format(end)}`;
  }
  return `${monthFmt.format(start)} ${dayFmt.format(start)} ??${monthFmt.format(end)} ${dayFmt.format(end)}`;
}

export function formatKRW(amount: number) {
  return `??{new Intl.NumberFormat("en-US").format(amount)}`;
}
