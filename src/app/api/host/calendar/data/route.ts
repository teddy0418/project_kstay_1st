import { getOrCreateServerUser } from "@/lib/auth/server";
import { getHostBookingsForMonth } from "@/lib/repositories/host-calendar";
import { apiError, apiOk } from "@/lib/api/response";

export async function GET(req: Request) {
  const user = await getOrCreateServerUser();
  if (!user) return apiError(401, "UNAUTHORIZED", "Not logged in");

  const url = new URL(req.url);
  const listingId = url.searchParams.get("listingId");
  const year = parseInt(url.searchParams.get("year") ?? "0", 10);
  const month = parseInt(url.searchParams.get("month") ?? "0", 10);
  if (!listingId || !year || !month || month < 1 || month > 12)
    return apiError(400, "BAD_REQUEST", "listingId, year, month required");

  const bookings = await getHostBookingsForMonth(user.id, listingId, year, month);
  return apiOk({ bookings });
}
