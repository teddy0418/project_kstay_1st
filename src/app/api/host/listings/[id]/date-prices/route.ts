import { getOrCreateServerUser } from "@/lib/auth/server";
import { getDatePrices, setDatePrice } from "@/lib/repositories/host-calendar";
import { apiError, apiOk } from "@/lib/api/response";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getOrCreateServerUser();
  if (!user) return apiError(401, "UNAUTHORIZED", "Not logged in");
  const { id: listingId } = await params;
  if (!listingId) return apiError(400, "BAD_REQUEST", "Listing ID required");

  const url = new URL(_req.url);
  const fromStr = url.searchParams.get("from");
  const toStr = url.searchParams.get("to");
  if (!fromStr || !toStr) return apiError(400, "BAD_REQUEST", "from and to (YYYY-MM-DD) required");
  const from = new Date(fromStr);
  const to = new Date(toStr);
  if (isNaN(from.getTime()) || isNaN(to.getTime())) return apiError(400, "BAD_REQUEST", "Invalid date");

  const prices = await getDatePrices(listingId, from, to);
  return apiOk({ prices });
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getOrCreateServerUser();
  if (!user) return apiError(401, "UNAUTHORIZED", "Not logged in");
  const { id: listingId } = await params;
  if (!listingId) return apiError(400, "BAD_REQUEST", "Listing ID required");

  const body = await req.json().catch(() => ({}));
  const dateStr = body.date;
  const priceKrw = typeof body.priceKrw === "number" ? body.priceKrw : parseInt(body.priceKrw, 10);
  if (!dateStr || Number.isNaN(priceKrw) || priceKrw < 0) return apiError(400, "BAD_REQUEST", "date and priceKrw required");
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return apiError(400, "BAD_REQUEST", "Invalid date");

  try {
    await setDatePrice(listingId, user.id, date, priceKrw);
    return apiOk({ ok: true });
  } catch {
    return apiError(403, "FORBIDDEN", "Not your listing");
  }
}
