import { cookies } from "next/headers";

/**
 * MVP: DB 붙이기 전 임시 구현
 * - 지금은 쿠키 kstay_host_has_listing=1 이면 "숙소 있음"으로 간주
 * - DB 붙이면 아래 로직을 prisma.listing.count(...)로 교체하면 끝
 */
export async function hasHostListing(): Promise<boolean> {
  const c = await cookies();
  const flag = c.get("kstay_host_has_listing")?.value;
  return flag === "1";
}
