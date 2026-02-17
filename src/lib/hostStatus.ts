export type HostListingStatus = "NONE" | "PENDING" | "APPROVED";

export function normalizeHostStatus(v?: string | null): HostListingStatus {
  if (!v) return "NONE";
  const s = String(v).toUpperCase();
  if (s === "PENDING") return "PENDING";
  if (s === "APPROVED") return "APPROVED";
  return "NONE";
}

export const HOST_STATUS_COOKIE = "kstay_host_listing_status";
