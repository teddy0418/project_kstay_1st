import { NextRequest } from "next/server";
import { apiOk } from "@/lib/api/response";
import { requireAuthWithDb } from "@/lib/api/auth-guard";
import { markNotificationRead } from "@/lib/repositories/booking-messages";

/** PATCH /api/notifications/[id]/read — 알림 읽음 처리. */
export async function PATCH(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuthWithDb();
  if (!auth.ok) return auth.response;
  const user = auth.user;

  const { id } = await params;
  await markNotificationRead(id, user.id);
  return apiOk({ ok: true });
}
