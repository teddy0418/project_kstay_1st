import { getOrCreateServerUser } from "@/lib/auth/server";
import { getHostFlowStatus } from "@/lib/host/server";
import { apiError, apiOk } from "@/lib/api/response";

export async function GET() {
  try {
    const user = await getOrCreateServerUser();
    if (!user) return apiError(401, "UNAUTHORIZED", "Login required");

    const status = await getHostFlowStatus(user.id);
    return apiOk({ status });
  } catch (error) {
    console.error("[api/host/listings/status] failed to fetch host status", error);
    return apiError(500, "INTERNAL_ERROR", "Failed to fetch host status");
  }
}
