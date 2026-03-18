import { z } from "zod";
import { prisma } from "@/lib/db";
import { apiError, apiOk } from "@/lib/api/response";
import { getOrCreateServerUser } from "@/lib/auth/server";
import { checkRateLimit, RATE_LIMITS, rateLimitResponse, getClientIp } from "@/lib/api/rate-limit";

const hostProfilePatchSchema = z.object({
  displayName: z.string().trim().max(100).optional(),
  payoutBank: z.string().trim().max(100).optional(),
  payoutAccount: z.string().trim().max(50).optional(),
  payoutName: z.string().trim().max(100).optional(),
}).strict();

/** GET: 호스트 프로필 + 정산 계좌 정보 */
export async function GET() {
  const user = await getOrCreateServerUser();
  if (!user) return apiError(401, "UNAUTHORIZED", "Login required");

  const profile = await prisma.hostProfile.findUnique({
    where: { userId: user.id },
    select: { displayName: true, payoutBank: true, payoutAccount: true, payoutName: true },
  });

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { displayName: true, profilePhotoUrl: true, name: true },
  });

  return apiOk({
    displayName: profile?.displayName ?? dbUser?.displayName ?? null,
    profilePhotoUrl: dbUser?.profilePhotoUrl ?? null,
    name: dbUser?.name ?? null,
    payoutBank: profile?.payoutBank ?? null,
    payoutAccount: profile?.payoutAccount ?? null,
    payoutName: profile?.payoutName ?? null,
  });
}

/** PATCH: 호스트 프로필·정산 계좌 저장 */
export async function PATCH(req: Request) {
  const rl = checkRateLimit(getClientIp(req), RATE_LIMITS.mutation);
  if (!rl.allowed) return rateLimitResponse();

  const user = await getOrCreateServerUser();
  if (!user) return apiError(401, "UNAUTHORIZED", "Login required");

  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return apiError(400, "BAD_REQUEST", "Invalid JSON");
  }

  const parsed = hostProfilePatchSchema.safeParse(raw);
  if (!parsed.success) {
    return apiError(400, "VALIDATION_ERROR", parsed.error.issues.map((e) => e.message).join(", "));
  }

  const { displayName: rawDisplayName, payoutBank: rawPayoutBank, payoutAccount: rawPayoutAccount, payoutName: rawPayoutName } = parsed.data;
  const displayName = rawDisplayName !== undefined ? (rawDisplayName || null) : undefined;
  const payoutBank = rawPayoutBank !== undefined ? (rawPayoutBank || null) : undefined;
  const payoutAccount = rawPayoutAccount !== undefined ? (rawPayoutAccount || null) : undefined;
  const payoutName = rawPayoutName !== undefined ? (rawPayoutName || null) : undefined;

  await prisma.hostProfile.upsert({
    where: { userId: user.id },
    create: {
      userId: user.id,
      displayName: displayName ?? undefined,
      payoutBank: payoutBank ?? undefined,
      payoutAccount: payoutAccount ?? undefined,
      payoutName: payoutName ?? undefined,
    },
    update: {
      ...(displayName !== undefined && { displayName }),
      ...(payoutBank !== undefined && { payoutBank }),
      ...(payoutAccount !== undefined && { payoutAccount }),
      ...(payoutName !== undefined && { payoutName }),
    },
  });

  if (displayName !== undefined) {
    await prisma.user.update({
      where: { id: user.id },
      data: { displayName },
    });
  }

  const updated = await prisma.hostProfile.findUnique({
    where: { userId: user.id },
    select: { displayName: true, payoutBank: true, payoutAccount: true, payoutName: true },
  });
  return apiOk(updated);
}
