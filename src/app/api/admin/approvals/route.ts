import { prisma } from "@/lib/db";
import { getServerSessionUser, requireAdminUser } from "@/lib/auth/server";
import { apiError, apiOk } from "@/lib/api/response";

export async function GET() {
  const sessionUser = await getServerSessionUser();
  if (!sessionUser) return apiError(401, "UNAUTHORIZED", "Login required");

  const admin = await requireAdminUser();
  if (!admin) return apiError(403, "FORBIDDEN", "Admin access required");

  const items = await prisma.listing.findMany({
    where: { status: "PENDING" },
    include: {
      host: {
        select: { id: true, name: true, role: true },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  return apiOk(
    items.map((item) => ({
      id: item.id,
      title: item.title,
      city: item.city,
      area: item.area,
      address: item.address,
      basePriceKrw: item.basePriceKrw,
      status: item.status,
      createdAt: item.createdAt,
      host: item.host,
    }))
  );
}
