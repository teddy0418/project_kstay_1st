import { prisma } from "@/lib/db";
import { apiError, apiOk } from "@/lib/api/response";
import { getServerSessionUser } from "@/lib/auth/server";
import { parseJsonBody } from "@/lib/api/validation";
import { updateProfileSchema } from "@/lib/validation/schemas";

/** GET: 현재 로그인 유저의 프로필(displayName, profilePhotoUrl) */
export async function GET() {
  const user = await getServerSessionUser();
  if (!user) return apiError(401, "UNAUTHORIZED", "Login required");

  let userId = user.id;
  if (user.email) {
    const byEmail = await prisma.user.findUnique({ where: { email: user.email.trim().toLowerCase() }, select: { id: true } });
    if (byEmail) userId = byEmail.id;
  }

  let name: string | undefined;
  let image: string | undefined;
  let displayName: string | undefined;
  let profilePhotoUrl: string | undefined;
  try {
    const dbUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, image: true, displayName: true, profilePhotoUrl: true },
    });
    if (!dbUser) return apiError(404, "NOT_FOUND", "User not found");
    name = dbUser.name ?? undefined;
    image = dbUser.image ?? undefined;
    displayName = dbUser.displayName ?? undefined;
    profilePhotoUrl = dbUser.profilePhotoUrl ?? undefined;
  } catch {
    const dbUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, image: true },
    });
    if (!dbUser) return apiError(404, "NOT_FOUND", "User not found");
    name = dbUser.name ?? undefined;
    image = dbUser.image ?? undefined;
  }

  return apiOk({
    name,
    image,
    displayName,
    profilePhotoUrl,
  });
}

/** PATCH: 프로필 표시 이름·사진 URL 저장 */
export async function PATCH(req: Request) {
  const user = await getServerSessionUser();
  if (!user) return apiError(401, "UNAUTHORIZED", "Login required");

  const parsed = await parseJsonBody(req, updateProfileSchema);
  if (!parsed.ok) return parsed.response;
  const { displayName, profilePhotoUrl } = parsed.data;

  let userId = user.id;
  if (user.email) {
    const byEmail = await prisma.user.findUnique({ where: { email: user.email.trim().toLowerCase() }, select: { id: true } });
    if (byEmail) userId = byEmail.id;
  }

  try {
    const dbUser = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(displayName !== undefined ? { displayName: displayName && displayName.trim() ? displayName.trim() : null } : {}),
        ...(profilePhotoUrl !== undefined ? { profilePhotoUrl: profilePhotoUrl && profilePhotoUrl.trim() ? profilePhotoUrl.trim() : null } : {}),
      },
      select: { displayName: true, profilePhotoUrl: true },
    });
    return apiOk({ displayName: dbUser.displayName ?? undefined, profilePhotoUrl: dbUser.profilePhotoUrl ?? undefined });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes("column") && msg.includes("does not exist")) {
      return apiError(501, "INTERNAL_ERROR", "Profile display name/photo not available. Run: npx prisma migrate deploy");
    }
    throw err;
  }
}
