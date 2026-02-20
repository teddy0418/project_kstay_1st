import { getOrCreateServerUser } from "@/lib/auth/server";
import { getHostFlowStatus } from "@/lib/host/server";
import { apiError, apiOk } from "@/lib/api/response";

export async function GET() {
  const user = await getOrCreateServerUser();
  if (!user) return apiError(401, "UNAUTHORIZED", "Login required");

  const status = await getHostFlowStatus(user.id);
  return apiOk({ status });
}
