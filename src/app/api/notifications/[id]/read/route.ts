import { NextRequest } from "next/server";
import { apiError, apiOk } from "@/lib/api/response";
import { getOrCreateServerUser } from "@/lib/auth/server";
import { markNotificationRead } from "@/lib/repositories/booking-messages";

/** PATCH /api/notifications/[id]/read — 알림 읽음 처리. */
export async function PATCH(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getOrCreateServerUser();
  if (!user) return apiError(401, "UNAUTHORIZED", "Sign in required");

  const { id } = await params;
  await markNotificationRead(id, user.id);
  return apiOk({ ok: true });
}
