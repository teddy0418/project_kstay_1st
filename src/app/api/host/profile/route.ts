import { prisma } from "@/lib/db";
import { apiError, apiOk } from "@/lib/api/response";
import { getOrCreateServerUser } from "@/lib/auth/server";

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

const PATCH_BODY = {
  displayName: String,
  payoutBank: String,
  payoutAccount: String,
  payoutName: String,
} as const;

/** PATCH: 호스트 프로필·정산 계좌 저장 */
export async function PATCH(req: Request) {
  const user = await getOrCreateServerUser();
  if (!user) return apiError(401, "UNAUTHORIZED", "Login required");

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return apiError(400, "BAD_REQUEST", "Invalid JSON");
  }

  const displayName = typeof body.displayName === "string" ? body.displayName.trim() || null : undefined;
  const payoutBank = typeof body.payoutBank === "string" ? body.payoutBank.trim() || null : undefined;
  const payoutAccount = typeof body.payoutAccount === "string" ? body.payoutAccount.trim() || null : undefined;
  const payoutName = typeof body.payoutName === "string" ? body.payoutName.trim() || null : undefined;

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
