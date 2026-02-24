import { getOrCreateServerUser } from "@/lib/auth/server";
import { getHostBookingsForList } from "@/lib/repositories/host-calendar";
import { apiError, apiOk } from "@/lib/api/response";

export async function GET(req: Request) {
  const user = await getOrCreateServerUser();
  if (!user) return apiError(401, "UNAUTHORIZED", "Not logged in");

  const url = new URL(req.url);
  const listingId = url.searchParams.get("listingId") ?? undefined;
  const status = url.searchParams.get("status") ?? undefined;

  const bookings = await getHostBookingsForList(user.id, { listingId, status });
  return apiOk({ bookings });
}
