import { getOrCreateServerUser } from "@/lib/auth/server";
import { getBlockedDates, blockDate, unblockDate } from "@/lib/repositories/host-calendar";
import { apiError, apiOk } from "@/lib/api/response";

export const dynamic = "force-dynamic";

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
  const from = new Date(fromStr + "T00:00:00Z");
  const to = new Date(toStr + "T23:59:59.999Z");
  if (isNaN(from.getTime()) || isNaN(to.getTime())) return apiError(400, "BAD_REQUEST", "Invalid date");

  const dates = await getBlockedDates(listingId, from, to);
  const res = apiOk({ dates });
  res.headers.set("Cache-Control", "no-store, no-cache, must-revalidate");
  return res;
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getOrCreateServerUser();
  if (!user) return apiError(401, "UNAUTHORIZED", "Not logged in");
  const { id: listingId } = await params;
  if (!listingId) return apiError(400, "BAD_REQUEST", "Listing ID required");

  const body = await req.json().catch(() => ({}));
  const dateStr = body.date;
  if (!dateStr) return apiError(400, "BAD_REQUEST", "date (YYYY-MM-DD) required");
  const date = new Date(dateStr + "T00:00:00Z");
  if (isNaN(date.getTime())) return apiError(400, "BAD_REQUEST", "Invalid date");

  try {
    await blockDate(listingId, user.id, date);
    return apiOk({ ok: true });
  } catch {
    return apiError(403, "FORBIDDEN", "Not your listing");
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getOrCreateServerUser();
  if (!user) return apiError(401, "UNAUTHORIZED", "Not logged in");
  const { id: listingId } = await params;
  if (!listingId) return apiError(400, "BAD_REQUEST", "Listing ID required");

  const url = new URL(req.url);
  const dateStr = url.searchParams.get("date");
  if (!dateStr) return apiError(400, "BAD_REQUEST", "date (YYYY-MM-DD) required");
  const date = new Date(dateStr + "T00:00:00Z");
  if (isNaN(date.getTime())) return apiError(400, "BAD_REQUEST", "Invalid date");

  try {
    await unblockDate(listingId, user.id, date);
    return apiOk({ ok: true });
  } catch {
    return apiError(403, "FORBIDDEN", "Not your listing");
  }
}
