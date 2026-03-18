import { prisma } from "@/lib/db";
import { apiOk } from "@/lib/api/response";
import { apiError } from "@/lib/api/response";
import { requireAuth } from "@/lib/api/auth-guard";
import { parseJsonBody } from "@/lib/api/validation";
import { updateProfileSchema } from "@/lib/validation/schemas";

/** GET: 현재 로그인 유저의 프로필(displayName, profilePhotoUrl) */
export async function GET() {
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;
  const user = auth.user;

  let userId = user.id;
  if (user.email) {
    const byEmail = await prisma.user.findUnique({ where: { email: user.email.trim().toLowerCase() }, select: { id: true } });
    if (byEmail) userId = byEmail.id;
  }

  let name: string | undefined;
  let image: string | undefined;
  let displayName: string | undefined;
  let profilePhotoUrl: string | undefined;
  let email: string | undefined;
  let phone: string | undefined;
  let nationality: string | undefined;
  let profileCompletedAt: Date | undefined;
  let createdAt: Date | undefined;
  try {
    const dbUser = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        image: true,
        displayName: true,
        profilePhotoUrl: true,
        email: true,
        phone: true,
        nationality: true,
        profileCompletedAt: true,
        createdAt: true,
      },
    });
    if (!dbUser) return apiError(404, "NOT_FOUND", "User not found");
    name = dbUser.name ?? undefined;
    image = dbUser.image ?? undefined;
    displayName = dbUser.displayName ?? undefined;
    profilePhotoUrl = dbUser.profilePhotoUrl ?? undefined;
    email = dbUser.email ?? undefined;
    phone = dbUser.phone ?? undefined;
    nationality = dbUser.nationality ?? undefined;
    profileCompletedAt = dbUser.profileCompletedAt ?? undefined;
    createdAt = dbUser.createdAt ?? undefined;
  } catch {
    const dbUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, image: true, profileCompletedAt: true, createdAt: true },
    });
    if (!dbUser) return apiError(404, "NOT_FOUND", "User not found");
    name = dbUser.name ?? undefined;
    image = dbUser.image ?? undefined;
    profileCompletedAt = dbUser.profileCompletedAt ?? undefined;
    createdAt = dbUser.createdAt ?? undefined;
  }

  return apiOk({
    name,
    image,
    displayName,
    profilePhotoUrl,
    email,
    phone,
    nationality,
    profileCompletedAt: profileCompletedAt?.toISOString() ?? null,
    createdAt: createdAt?.toISOString() ?? null,
  });
}

/** PATCH: 프로필 표시 이름·사진 URL 저장 또는 온보딩 완료 */
export async function PATCH(req: Request) {
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;
  const user = auth.user;

  const parsed = await parseJsonBody(req, updateProfileSchema);
  if (!parsed.ok) return parsed.response;
  const { displayName, profilePhotoUrl, completeOnboarding, name, email, phone, nationality, privacyConsent } = parsed.data;

  let userId = user.id;
  if (user.email) {
    const byEmail = await prisma.user.findUnique({ where: { email: user.email.trim().toLowerCase() }, select: { id: true } });
    if (byEmail) userId = byEmail.id;
  }

  const updates: Record<string, unknown> = {};
  if (displayName !== undefined) updates.displayName = displayName && displayName.trim() ? displayName.trim() : null;
  if (profilePhotoUrl !== undefined) updates.profilePhotoUrl = profilePhotoUrl && profilePhotoUrl.trim() ? profilePhotoUrl.trim() : null;
  if (completeOnboarding === true && privacyConsent === true) {
    updates.profileCompletedAt = new Date();
    const trimmedName = name?.trim();
    if (name !== undefined && trimmedName) {
      updates.name = trimmedName;
      if (displayName === undefined) updates.displayName = trimmedName;
    }
    if (email !== undefined && email.trim()) updates.email = email.trim().toLowerCase();
    if (phone !== undefined) updates.phone = phone && phone.trim() ? phone.trim() : null;
    if (nationality !== undefined) updates.nationality = nationality && nationality.trim() ? nationality.trim() : null;
  }

  try {
    const dbUser = await prisma.user.update({
      where: { id: userId },
      data: updates as never,
      select: { displayName: true, profilePhotoUrl: true, profileCompletedAt: true },
    });
    return apiOk({
      displayName: dbUser.displayName ?? undefined,
      profilePhotoUrl: dbUser.profilePhotoUrl ?? undefined,
      profileCompletedAt: dbUser.profileCompletedAt?.toISOString() ?? null,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes("column") && msg.includes("does not exist")) {
      return apiError(501, "INTERNAL_ERROR", "Profile not available. Run: npx prisma migrate deploy");
    }
    throw err;
  }
}
